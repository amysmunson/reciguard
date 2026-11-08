// Only ordinary web links may be opened from recipe data. A recipe's source
// link is user/import-supplied text, so without this check a stored value
// like "tel:…", "sms:…", "javascript:…", "file:…", or another app's custom
// scheme would be handed straight to Linking.openURL.
export const isSafeWebUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'https:' || url.protocol === 'http:') && !!url.hostname;
  } catch {
    return false;
  }
};
