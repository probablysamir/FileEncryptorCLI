# FileEncryptorCLI

To encrypt a file:

```ts-node .../index.ts encrypt <filename> --key [encryptionKey] --iv [initializationVector]```

Key and initialization vector are optional and will be stored in key.txt file after encryption

To decrypt a file:

```ts-node .../index.ts decrypt <filename> --key [encryptionKey] --iv [initializationVector]```

Key and initialization vector are optional if it exists in key.txt file 
