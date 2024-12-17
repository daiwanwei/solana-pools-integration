import { createFromRoot } from "codama";
import { rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import { renderJavaScriptVisitor, renderRustVisitor } from '@codama/renderers';
import anchorIdl from "./idls/liquidity_proxy.json";

// @ts-ignore
const codama = createFromRoot(rootNodeFromAnchor(anchorIdl));

codama.accept(renderJavaScriptVisitor('clients/js/src/generated', {  }));
