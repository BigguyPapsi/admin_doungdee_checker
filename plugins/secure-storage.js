import SecureLS from "secure-ls";

const secureStorage = new SecureLS({
  encodingType: "aes",
  encryptionSecret: "my-secret-key-123",
  isCompression: false,
});

export default secureStorage;