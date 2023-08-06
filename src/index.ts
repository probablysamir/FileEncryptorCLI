import { Command } from "commander";
import crypto from "crypto";
import path from "path";
import fs from "fs";

const program = new Command();

interface MyCommand extends Command {
  key?: string;
  iv?: string;
}

interface Input {
  name?: string;
  value?: string;
}

async function encryptFile(inputFilePath: string, options: Input[]) {
  console.log("Encrypting file");
  const encryptionKey =
    (options.find((option) => option.name === "key")?.value as string) ||
    crypto.randomBytes(16).toString("hex");
  const iv =
    (options.find((option) => option.name === "iv")?.value as string) ||
    crypto.randomBytes(16).toString("hex");
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    encryptionKey,
    Buffer.from(iv, "hex")
  );

  const input = fs.createReadStream(inputFilePath);
  const output = fs.createWriteStream(inputFilePath + ".encrypted");

  input.pipe(cipher).pipe(output);
  output.on("finish", () => {
    console.log("File encrypted");
  });
  const keyFile = `${encryptionKey} ${iv}`;
  fs.writeFile(path.resolve("key.txt"), keyFile, (err) => {
    if (err) {
      console.log("Error occured while writing key file: ", err);
    } else {
      console.log("Key file written successfully");
    }
  });
}

async function decryptFile(inputFilePath: string, options: Input[]) {
  try {
    console.log("Decrypting file");
    let encryptionKey = options.find((option) => option.name === "key")?.value;
    let iv = options.find((option) => option.name === "iv")?.value;
    if (encryptionKey === undefined || iv === undefined) {
      const keyFileData = await fs.promises.readFile(path.resolve("key.txt"));
      console.log("Key file read successfully");
      [encryptionKey, iv] = keyFileData.toString().split(" ");
    }

    const input = fs.createReadStream(inputFilePath);
    const output = fs.createWriteStream(inputFilePath.split(".encrypted")[0]);

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      encryptionKey,
      Buffer.from(iv, "hex")
    );

    input.pipe(decipher).pipe(output);

    decipher.on("error", (err) => {
      console.error("Decryption error:", err);
    });

    output.on("finish", () => {
      console.log("File decrypted");
    });
  } catch (err) {
    console.error("Error occurred while reading encryption key and IV: ", err);
  }
}

async function load() {
  program
    .version("0.0.1")
    .description(
      "A npm package cli that helps to handle files and different operations"
    );

  program
    .command("encrypt")
    .alias("e")
    .description("Encrypt a file")
    .argument("<inputFile>", "File to encrypt")
    .option("-k, --key <key>", "Decryption key")
    .option("-i, --iv <iv>", "Initialization vector")
    .action(async (inputFile, command: MyCommand) => {
      const options: Input[] = [];
      if (command.key !== undefined) {
        options.push({ name: "key", value: command.key });
      }
      if (command.iv !== undefined) {
        options.push({ name: "iv", value: command.iv });
      }

      const inputFilePath = path.resolve(inputFile);
      await encryptFile(inputFilePath, options);
    });

  program
    .command("decrypt")
    .alias("d")
    .description("Decrypt a file")
    .argument("<inputFile>", "File to decrypt")
    .option("-k, --key <key>", "Encryption key")
    .option("-i, --iv <iv>", "Initialization vector")
    .action(async (inputFile, command: MyCommand) => {
      const options: Input[] = [];
      if (command.key !== undefined) {
        options.push({ name: "key", value: command.key });
      }
      if (command.iv !== undefined) {
        options.push({ name: "iv", value: command.iv });
      }

      const inputFilePath = path.resolve(inputFile);
      await decryptFile(inputFilePath, options);
    });

  program.parse(process.argv);
}

load();
