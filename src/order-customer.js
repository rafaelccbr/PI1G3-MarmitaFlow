// Shared by checkout and API so delivery and pickup follow the same rules.
export function orderCustomer(input) {
  const fail = (field, message) => {
    const error = new Error(message);
    error.field = field;
    throw error;
  };
  const customerName = typeof input.customerName === 'string' ? input.customerName.trim() : '';
  if (!customerName || customerName.length > 200) fail('customerName', 'Informe seu nome (até 200 caracteres).');

  const phone = typeof input.customerPhone === 'string' ? input.customerPhone.trim() : '';
  let customerPhone = phone.replace(/\D/g, '');
  if (customerPhone.length > 11 && customerPhone.startsWith('55')) customerPhone = customerPhone.slice(2);
  if (!/^[+\d\s().-]+$/.test(phone) || !/^[1-9]\d{9,10}$/.test(customerPhone)) {
    fail('customerPhone', 'Informe um telefone com DDD e 10 ou 11 dígitos.');
  }

  const address = input.orderType === 'pickup' ? 'Retirada no Balcão' : (typeof input.address === 'string' ? input.address.trim() : '');
  if (!address || address.length > 500) fail('address', 'Informe o endereço de entrega (até 500 caracteres).');
  return { customerName, customerPhone, address };
}
