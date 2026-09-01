function normalizeRecipient(recipient) {
  const fallbackPhone =
    recipient.phone ?? recipient.mobile ?? recipient.mobileNumber ?? "";

  return {
    ...recipient,
    ...(fallbackPhone && !recipient.whatsappPhone && !recipient.whatsappNumber
      ? { whatsappPhone: fallbackPhone }
      : {}),
    ...(fallbackPhone && !recipient.smsPhone && !recipient.smsNumber
      ? { smsPhone: fallbackPhone }
      : {})
  };
}

function normalizeChannel(channel) {
  if (channel?.type !== "whatsapp") return channel;

  const templateName = channel.templateName ?? channel.templateId;
  if (!templateName) return channel;

  const { templateId: _legacyTemplateId, ...rest } = channel;
  return { ...rest, templateName };
}

export function notificationData({
  recipients,
  channels,
  outputVar,
  dedupeKey,
  messageCategory = "transactional"
}) {
  const normalizedRecipients = recipients.map(normalizeRecipient);
  const normalizedChannels = channels.map(normalizeChannel);

  return {
    recipients: normalizedRecipients,
    recipientsJson: JSON.stringify(normalizedRecipients, null, 2),
    channels: normalizedChannels,
    channelsJson: JSON.stringify(normalizedChannels, null, 2),
    strategy: "priority_order",
    messageCategory,
    dedupeKey,
    defaultCountryCode: "+91",
    strictTemplateValidation: true,
    outputVar
  };
}

export function normalizeNotificationFlow(flowExport) {
  for (const node of flowExport?.flow?.nodes ?? []) {
    if (node.type !== "notification" || !node.data) continue;

    const normalized = notificationData({
      recipients: node.data.recipients ?? JSON.parse(node.data.recipientsJson ?? "[]"),
      channels: node.data.channels ?? JSON.parse(node.data.channelsJson ?? "[]"),
      outputVar: node.data.outputVar,
      dedupeKey: node.data.dedupeKey,
      messageCategory: node.data.messageCategory
    });

    node.data = { ...node.data, ...normalized };
  }

  return flowExport;
}
