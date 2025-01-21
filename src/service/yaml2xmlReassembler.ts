"use strict";

import { stat, readdir } from "node:fs/promises";
import { join } from "node:path/posix";

import { logger } from "@src/index";
import { reassembleHandler } from "@src/service/reassembleHandler";
import { transform2XML } from "@src/service/transform2XML";
import { deleteReassembledXML } from "@src/service/deleteReassembledXML";

export class YamlToXmlReassembler {
  async reassemble(xmlAttributes: {
    filePath: string;
    fileExtension?: string;
    postPurge?: boolean;
  }): Promise<void> {
    const {
      filePath,
      fileExtension = "xml",
      postPurge = false,
    } = xmlAttributes;
    const fileStat = await stat(filePath);

    if (fileStat.isFile()) {
      logger.error(`The path provided is not a directory: ${filePath}`);
      return;
    } else if (fileStat.isDirectory()) {
      await this.processFile(filePath);
    }

    await reassembleHandler(filePath, fileExtension, postPurge);
    // delete XML files created during reassembly - this is needed if postPurge is false
    if (!postPurge) await deleteReassembledXML(filePath);
  }

  async processFile(filePath: string): Promise<void> {
    const files = await readdir(filePath);
    for (const file of files) {
      const subFilePath = join(filePath, file);
      const subFileStat = await stat(subFilePath);
      if (subFileStat.isFile() && subFilePath.endsWith(".yaml")) {
        await transform2XML(subFilePath);
      } else if (subFileStat.isDirectory()) {
        await this.processFile(subFilePath);
      }
    }
  }
}
