// utils/treeWalker.js

export function getCurrentNode(tree, selection, steps) {
  let node = tree;
  for (let key of steps) {
    const selectedValue = selection[key];
    if (!selectedValue || !node[selectedValue]) break;
    node = node[selectedValue];
  }
  return node;
}
