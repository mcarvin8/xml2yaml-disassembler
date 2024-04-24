import { readdir, readFile, writeFile, rm } from "node:fs/promises";
import { strictEqual } from "node:assert";
import { resolve, join } from "node:path";
import { copy } from "fs-extra";

import {
  XmlToYamlDisassembler,
  YamlToXmlReassembler,
  setLogLevel,
  logger,
} from "../src/index";

setLogLevel("debug");
const baselineDir: string = "test/baselines";
const mockDir: string = "mock";
let xml2yamlDisassemblerHandler: XmlToYamlDisassembler;
let yaml2xmlReassemblerHandler: YamlToXmlReassembler;

describe("main function", () => {
  beforeAll(async () => {
    await copy(baselineDir, mockDir, { overwrite: true });
    xml2yamlDisassemblerHandler = new XmlToYamlDisassembler();
    yaml2xmlReassemblerHandler = new YamlToXmlReassembler();
  });

  beforeEach(async () => {
    jest.spyOn(logger, "error");
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await rm(mockDir, { recursive: true });
  });

  it("should disassemble & transform 1 XML file into YAML files.", async () => {
    await xml2yamlDisassemblerHandler.disassemble({
      xmlPath: "mock/HR_Admin.permissionset-meta.xml",
      uniqueIdElements:
        "application,apexClass,name,externalDataSource,flow,object,apexPage,recordType,tab,field",
    });

    expect(logger.error).not.toHaveBeenCalled();
  });
  it("should disassemble & transform a directory of XML files into YAML files.", async () => {
    await xml2yamlDisassemblerHandler.disassemble({
      xmlPath: "mock",
      uniqueIdElements:
        "application,apexClass,name,externalDataSource,flow,object,apexPage,recordType,tab,field",
      postPurge: true,
    });

    expect(logger.error).not.toHaveBeenCalled();
  });
  it("should reassemble the XML file.", async () => {
    await yaml2xmlReassemblerHandler.reassemble({
      yamlPath: "mock/HR_Admin",
      fileExtension: "permissionset-meta.xml",
    });

    expect(logger.error).not.toHaveBeenCalled();
  });
  it("should reassemble the XML file with comments.", async () => {
    await yaml2xmlReassemblerHandler.reassemble({
      yamlPath: "mock/Numbers-fr",
      fileExtension: "globalValueSetTranslation-meta.xml",
    });

    expect(logger.error).not.toHaveBeenCalled();
  });
  it("should reassemble the CDATA XML file.", async () => {
    await yaml2xmlReassemblerHandler.reassemble({
      yamlPath: "mock/VidLand_US",
      fileExtension: "marketingappextension-meta.xml",
    });

    expect(logger.error).not.toHaveBeenCalled();
  });
  it("should reassemble the XML file with an array of leafs.", async () => {
    await yaml2xmlReassemblerHandler.reassemble({
      yamlPath: "mock/Dreamhouse",
      fileExtension: "app-meta.xml",
    });

    expect(logger.error).not.toHaveBeenCalled();
  });
  it("should reassemble the XML file with attributes.", async () => {
    await yaml2xmlReassemblerHandler.reassemble({
      yamlPath: "mock/attributes",
    });

    expect(logger.error).not.toHaveBeenCalled();
  });
  it("should test disassemble error condition (XML file path not provided).", async () => {
    let fakeFile = "mock/not-an-xml.txt";
    fakeFile = resolve(fakeFile);
    const fakeFileContents = "Testing error condition.";
    await writeFile(fakeFile, fakeFileContents);
    await xml2yamlDisassemblerHandler.disassemble({
      xmlPath: fakeFile,
    });
    expect(logger.error).toHaveBeenCalled();
  });
  it("should test reassemble error condition (file path provided).", async () => {
    const fakeFile = "mock/not-an-xml.txt";
    await yaml2xmlReassemblerHandler.reassemble({
      yamlPath: fakeFile,
    });
    await rm(fakeFile);
    expect(logger.error).toHaveBeenCalled();
  });
  // This should always be the final test
  it("should compare the files created in the mock directory against the baselines to confirm no changes.", async () => {
    await compareDirectories(baselineDir, mockDir);
  });
});

async function compareDirectories(
  referenceDir: string,
  mockDir: string,
): Promise<void> {
  const entriesinRef = await readdir(referenceDir, { withFileTypes: true });

  // Only compare files that are in the reference directory
  for (const entry of entriesinRef) {
    const refEntryPath = join(referenceDir, entry.name);
    const mockPath = join(mockDir, entry.name);

    if (entry.isDirectory()) {
      // If it's a directory, recursively compare its contents
      await compareDirectories(refEntryPath, mockPath);
    } else {
      // If it's a file, compare its content
      const refContent = await readFile(refEntryPath, "utf-8");
      const mockContent = await readFile(mockPath, "utf-8");
      strictEqual(
        refContent,
        mockContent,
        `File content is different for ${entry.name}`,
      );
    }
  }
}
