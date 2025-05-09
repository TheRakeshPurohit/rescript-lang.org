/*
 * This script is used for generating the table of contents for prose
 * text documents
 */
import { unified } from "unified";
import glob from "glob";
import path from "path";
import fs from "fs";
import { URL } from "url";

import { defaultProcessor } from "./markdown.js";

const pathname = new URL(".", import.meta.url).pathname;
const __dirname =
  process.platform !== "win32" ? pathname : pathname.substring(1);

// orderArr: ["introduction", "overview",,...]
const orderFiles = (filepaths, orderArr) => {
  const order = orderArr.reduce((acc, next, i) => {
    acc[next] = null;
    return acc;
  }, {});

  filepaths.forEach((filepath) => {
    const id = path.basename(filepath, path.extname(filepath));
    order[id] = filepath;
  });

  // last sanity check if there's an unmatched filepath
  Object.entries(order).forEach(([name, filepath]) => {
    // may happen e.g. due to invalid file paths within
    // sidebar json
    if (filepath == null) {
      throw new Error(
        `Cannot find file for "${name}". Does it exist in the pages folder?`
      );
    }
  });

  return Object.values(order);
};

// Used for collapsing nested inlineCodes with the actual header text
const collapseHeaderChildren = (children) => {
  return children.reduce((acc, node) => {
    if (node.type === "link") {
      return acc + collapseHeaderChildren(node.children);
    }
    // Prevents 'undefined' values in our headers
    else if (node.value == null) {
      return acc;
    }
    return acc + node.value;
  }, "");
};

// sidebarJson: { [category: string]: array<plain_filename_without_ext> }
const processFile = (filepath, sidebarJson = {}) => {
  const content = fs.readFileSync(filepath, "utf8");
  const result = defaultProcessor.processSync(content);
  const data = result.data.matter;

  const pagesPath = path.resolve("./pages");
  const relFilepath = path.relative(pagesPath, filepath);
  const parsedPath = path.parse(relFilepath);
  const filename = path.basename(filepath, path.extname(filepath));

  const title = data.title || result.data.mainHeader || filename;

  let category;
  for (const [categoryName, items] of Object.entries(sidebarJson)) {
    if (items.find((item) => filename === item)) {
      category = categoryName;
      break;
    }
  }

  const dataset = {
    id: filename,
    headers: result.data.headers,
    href: path.join(parsedPath.dir, parsedPath.name),
    title,
  };

  if (category != null) {
    dataset.category = category;
  }
  return dataset;
};

const createTOC = (result) => {
  // Currently we reorder the data to a map, the key is
  // reflected as the router pathname, as defined by the
  // NextJS router
  return result.reduce((acc, data) => {
    const { title, headers, category, id } = data;
    acc["/" + data.href] = {
      id,
      title,
      headers,
      category,
    };

    return acc;
  }, {});
};

const createManualToc = (version) => {
  const versionNoDot = version.replaceAll(".", "");
  const MD_DIR = path.join(__dirname, `../pages/docs/manual/${version}`);

  const SIDEBAR_JSON = path.join(
    __dirname,
    `../data/sidebar_manual_${versionNoDot}.json`
  );

  const TARGET_FILE = path.join(
    __dirname,
    `../index_data/manual_${versionNoDot}_toc.json`
  );

  const sidebarJson = JSON.parse(fs.readFileSync(SIDEBAR_JSON));

  const FILE_ORDER = Object.values(sidebarJson).reduce((acc, items) => {
    return acc.concat(items);
  }, []);

  const files = glob.sync(`${MD_DIR}/*.?(js|md?(x))`);
  const ordered = orderFiles(files, FILE_ORDER);

  const result = ordered.map((filepath) => processFile(filepath, sidebarJson));
  const toc = createTOC(result);

  fs.writeFileSync(TARGET_FILE, JSON.stringify(toc), "utf8");
};

const createReactToc = (version) => {
  const versionLabel = version.replace(/\./g, "");
  const MD_DIR = path.join(__dirname, "../pages/docs/react");
  const SIDEBAR_JSON = path.join(
    __dirname,
    `../data/sidebar_react_${versionLabel}.json`
  );
  const TARGET_FILE = path.join(
    __dirname,
    `../index_data/react_${versionLabel}_toc.json`
  );

  const sidebarJson = JSON.parse(fs.readFileSync(SIDEBAR_JSON));

  const FILE_ORDER = Object.values(sidebarJson).reduce((acc, items) => {
    return acc.concat(items);
  }, []);

  const files = glob.sync(`${MD_DIR}/${version}/*.md?(x)`);
  const ordered = orderFiles(files, FILE_ORDER);

  const result = ordered.map((filepath) => processFile(filepath, sidebarJson));
  const toc = createTOC(result);

  fs.writeFileSync(TARGET_FILE, JSON.stringify(toc), "utf8");
};

const createCommunityToc = () => {
  const MD_DIR = path.join(__dirname, "../pages/community");
  const SIDEBAR_JSON = path.join(__dirname, "../data/sidebar_community.json");
  const TARGET_FILE = path.join(__dirname, "../index_data/community_toc.json");

  const sidebarJson = JSON.parse(fs.readFileSync(SIDEBAR_JSON));

  const FILE_ORDER = Object.values(sidebarJson).reduce((acc, items) => {
    return acc.concat(items);
  }, []);

  const files = glob.sync(`${MD_DIR}/*.?(js|md?(x))`);
  const ordered = orderFiles(files, FILE_ORDER);

  const result = ordered.map((filepath) => processFile(filepath, sidebarJson));
  const toc = createTOC(result);

  fs.writeFileSync(TARGET_FILE, JSON.stringify(toc), "utf8");
};

/*
const debugToc = () => {
  const MD_DIR = path.join(__dirname, "../pages/docs/manual/latest");

  const files = glob.sync(`${MD_DIR}/introduction.md?(x)`); 
  const result = files.map(processFile);
  const toc = createTOC(result);

  console.log(JSON.stringify(toc, null, 2));

};

debugToc();
*/

let manualVersions = ["v12.0.0", "v11.0.0", "v10.0.0", "v9.0.0", "v8.0.0"];
let reactManualVersions = ["latest", "v0.10.0", "v0.11.0"];

manualVersions.forEach(createManualToc);
reactManualVersions.forEach(createReactToc);
createCommunityToc();
