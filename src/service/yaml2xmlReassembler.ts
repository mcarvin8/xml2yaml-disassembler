"use strict";

import { stat, readdir } from "node:fs/promises";
import { join } from "node:path";

import { logger } from "@src/index";
import { reassembleHandler } from "@src/service/reassembleHandler";
import { transform2XML } from "@src/service/transform2XML";
import { deleteReassembledXML } from "@src/service/deleteReassembledXML";

export class YamlToXmlReassembler {
  async reassemble(xmlAttributes: {
    yamlPath: string;
    fileExtension?: string;
    postPurge?: boolean;
  }): Promise<void> {
    const {
      yamlPath,
      fileExtension = "xml",
      postPurge = false,
    } = xmlAttributes;
    const fileStat = await stat(yamlPath);

    if (fileStat.isFile()) {
      logger.error(`The path ${yamlPath} is not a directory.`);
      return;
    } else if (fileStat.isDirectory()) {
      await this.processFile(yamlPath);
    }

    await reassembleHandler(yamlPath, fileExtension, postPurge);
    // delete XML files created during reassembly - this is needed if postPurge is false
    if (!postPurge) await deleteReassembledXML(yamlPath);
  }

  async processFile(yamlPath: string): Promise<void> {
    const files = await readdir(yamlPath);
    for (const file of files) {
      const filePath = join(yamlPath, file);
      const fileStat = await stat(filePath);
      if (fileStat.isFile() && filePath.endsWith(".yaml")) {
        await transform2XML(filePath);
      } else if (fileStat.isDirectory()) {
        await this.processFile(filePath);
      }
    }
  }
}
