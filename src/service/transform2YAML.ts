"use strict";

import { readdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path/posix";
import { stringify } from "yaml";
import { parseXML } from "xml-disassembler";

import { logger } from "@src/index";

export async function transform2YAML(xmlPath: string): Promise<void> {
  const subFiles = await readdir(xmlPath);
  for (const subFile of subFiles) {
    const subFilePath = join(xmlPath, subFile);
    if ((await stat(subFilePath)).isDirectory()) {
      await transform2YAML(subFilePath);
    } else if (
      (await stat(subFilePath)).isFile() &&
      subFilePath.endsWith(".xml")
    ) {
      await writeYAML(subFilePath);
      await rm(subFilePath);
    }
  }
}

async function writeYAML(xmlPath: string): Promise<void> {
  const parsedXml = await parseXML(xmlPath);
  const yamlString = stringify(parsedXml);
  const yamlPath = xmlPath.replace(/\.xml$/, ".yaml");
  await writeFile(yamlPath, yamlString);
  logger.debug(`${xmlPath} has been transformed into ${yamlPath}`);
}
