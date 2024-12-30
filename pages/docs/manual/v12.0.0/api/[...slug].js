import {
  getStaticPathsByVersion,
  getStaticPropsByVersion,
} from "src/ApiDocs.mjs";

import APIDocs from "src/ApiDocs.mjs";

export async function getStaticProps(ctx) {
  return await getStaticPropsByVersion({ ...ctx, version: "v12.0.0" });
}

export async function getStaticPaths(ctx) {
  return await getStaticPathsByVersion("v12.0.0");
}

export default function Comp(props) {
  return <APIDocs {...props} />;
}