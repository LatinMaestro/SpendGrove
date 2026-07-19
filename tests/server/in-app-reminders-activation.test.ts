import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const componentPath = new URL("../../components/in-app-reminders.tsx", import.meta.url);
const routePath = new URL("../../app/api/account/reminders/route.ts", import.meta.url);
const homePath = new URL("../../app/page.tsx", import.meta.url);
const exportPath = new URL("../../src/server/account-export.ts", import.meta.url);
const deletionPath = new URL("../../src/server/account-deletion.ts", import.meta.url);
const schemaPath = new URL("../../prisma/schema.prisma", import.meta.url);

describe("Preview in-app reminder activation", () => {
  it("renders only through the verified Preview gate and existing Home destination", async () => {
    const [home, component] = await Promise.all([
      readFile(homePath, "utf8"),
      readFile(componentPath, "utf8"),
    ]);
    expect(home).toContain("accountPersistenceAvailable && isVerifiedPreviewRuntime()");
    expect(home).toContain("<InAppReminders");
    expect(component).toContain("Private in-app reminders only");
    expect(component).toContain("No email, text message or push notification is sent.");
    expect(component).not.toMatch(/Notification\.requestPermission|serviceWorker|pushToken/);
  });

  it("keeps authentication and owner-scoped server services as the security boundary", async () => {
    const route = await readFile(routePath, "utf8");
    expect(route).toContain("getCurrentUserContext()");
    expect(route).toContain("getInAppReminders");
    expect(route).toContain("mutateInAppReminder");
    expect(route).not.toMatch(/userId\s*[:=]\s*(?:input|request|payload)/);
  });

  it("keeps reminder interaction plain, accessible and progressively disclosed", async () => {
    const component = await readFile(componentPath, "utf8");
    expect(component).toContain('aria-labelledby="reminders-heading"');
    expect(component).toContain('role="status"');
    expect(component).toContain('role="alert"');
    expect(component).toContain("Reminder preferences");
    expect(component).toContain("Past reminders");
    expect(component).toContain("Due today");
    expect(component).toContain("Upcoming");
    expect(component).toContain("Done");
    expect(component).toContain("Dismiss");
  });

  it("includes safe reminder lifecycle in export and account deletion", async () => {
    const [accountExport, deletion] = await Promise.all([
      readFile(exportPath, "utf8"),
      readFile(deletionPath, "utf8"),
    ]);
    expect(accountExport).toContain("reminderPreferences: ExportRecord[]");
    expect(accountExport).toContain("reminders: ExportRecord[]");
    expect(accountExport).toContain("db.reminderPreference.findMany");
    expect(accountExport).toContain("db.reminder.findMany");
    expect(accountExport).not.toContain("dedupeKey: true");
    expect(deletion).toContain("transaction.reminder.deleteMany");
    expect(deletion).toContain("transaction.reminderPreference.deleteMany");
  });

  it("requires no schema, migration, package or remote-delivery change", async () => {
    const schema = await readFile(schemaPath, "utf8");
    expect(schema).toContain("model ReminderPreference");
    expect(schema).toContain("model Reminder");
    expect(schema).not.toMatch(/PushSubscription|DeviceToken|EmailDelivery|SmsDelivery/);
  });
});
