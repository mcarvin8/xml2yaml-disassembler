"use strict";

import { readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path/posix";
import { stringify } from "yaml";
import {
  parseXML,
  withConcurrencyLimit,
  getConcurrencyThreshold,
} from "xml-disassembler";

import { logger } from "@src/index";

export async function transform2YAML(xmlPath: string): Promise<void> {
  const tasks: (() => Promise<void>)[] = [];
  const files = await readdir(xmlPath, { withFileTypes: true });
  const concurrencyLimit = getConcurrencyThreshold();
  const foldersToRemote = [];

  for (const subFile of files) {
    const subFilePath = join(xmlPath, subFile.name);
    if (subFile.isDirectory()) {
      tasks.push(() => transform2YAML(subFilePath));
    } else if (subFile.isFile() && subFilePath.endsWith(".xml")) {
      tasks.push(() => writeYAML(subFilePath));
      foldersToRemote.push(subFilePath);
    }
  }
  await withConcurrencyLimit(tasks, concurrencyLimit);
  const deleteTasks = foldersToRemote.map((filePath) => () => rm(filePath));
  await withConcurrencyLimit(deleteTasks, concurrencyLimit);
}

async function writeYAML(xmlPath: string): Promise<void> {
  const parsedXml = await parseXML(xmlPath);
  const yamlString = stringify(parsedXml);
  const yamlPath = xmlPath.replace(/\.xml$/, ".yaml");
  await writeFile(yamlPath, yamlString);
  logger.debug(`${xmlPath} has been transformed into ${yamlPath}`);
}
