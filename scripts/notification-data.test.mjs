import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeNotificationFlow,
  notificationData
} from "./notification-data.mjs";

test("notificationData maps a shared phone to WhatsApp and SMS destinations", () => {
  const data = notificationData({
    recipients: [
      {
        type: "customer",
        phone: "{{customer_mobile}}",
        email: "{{customer_email}}"
      }
    ],
    channels: [
      {
        type: "whatsapp",
        templateId: "booking_confirmed",
        enabled: true
      }
    ],
    outputVar: "notification_result",
    dedupeKey: "{{booking_id}}:confirmation"
  });

  assert.equal(data.recipients[0].whatsappPhone, "{{customer_mobile}}");
  assert.equal(data.recipients[0].smsPhone, "{{customer_mobile}}");
  assert.equal(data.channels[0].templateName, "booking_confirmed");
  assert.equal("templateId" in data.channels[0], false);
  assert.deepEqual(JSON.parse(data.recipientsJson), data.recipients);
  assert.deepEqual(JSON.parse(data.channelsJson), data.channels);
});

test("notificationData preserves explicit channel-specific destinations", () => {
  const data = notificationData({
    recipients: [
      {
        type: "customer",
        phone: "{{shared_phone}}",
        whatsappPhone: "{{whatsapp_phone}}",
        smsPhone: "{{sms_phone}}"
      }
    ],
    channels: [
      {
        type: "sms",
        templateName: "SMSTemplate1",
        variables: { "1": "{{customer_name}}", "2": "{{otp}}" },
        peid: "{{dlt_peid}}",
        ctid: "{{dlt_ctid}}",
        enabled: true
      }
    ],
    outputVar: "sms_result",
    dedupeKey: "{{system.sessionId}}:sms"
  });

  assert.equal(data.recipients[0].whatsappPhone, "{{whatsapp_phone}}");
  assert.equal(data.recipients[0].smsPhone, "{{sms_phone}}");
  assert.equal(data.channels[0].templateName, "SMSTemplate1");
  assert.deepEqual(data.channels[0].variables, {
    "1": "{{customer_name}}",
    "2": "{{otp}}"
  });
});

test("normalizeNotificationFlow updates JSON-only notification data", () => {
  const flow = normalizeNotificationFlow({
    flow: {
      nodes: [
        {
          type: "notification",
          data: {
            recipientsJson: "[{\"phone\":\"{{mobile}}\"}]",
            channelsJson:
              "[{\"type\":\"whatsapp\",\"templateId\":\"booking_confirmed\"}]",
            outputVar: "result",
            dedupeKey: "{{system.sessionId}}:booking"
          }
        }
      ]
    }
  });

  assert.deepEqual(flow.flow.nodes[0].data.recipients, [
    {
      phone: "{{mobile}}",
      whatsappPhone: "{{mobile}}",
      smsPhone: "{{mobile}}"
    }
  ]);
  assert.deepEqual(flow.flow.nodes[0].data.channels, [
    { type: "whatsapp", templateName: "booking_confirmed" }
  ]);
});
