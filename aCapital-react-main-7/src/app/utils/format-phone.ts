export const formatPhone = (phone: string) => {
  const match = phone.match(/\+7(\d{3})(\d{3})(\d{2})(\d{2})/);
  if (!match) return phone;
  return `+7(${match[1]})${match[2]}-${match[3]}-${match[4]}`;
}