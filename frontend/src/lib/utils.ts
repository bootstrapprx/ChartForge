import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MasterAccount, MasterAccountNode } from "@/types/masterchart";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const buildTree = (items: MasterAccount[]): MasterAccountNode[] => {
  const tree: MasterAccountNode[] = [];
  const childrenOf: { [key: string]: MasterAccountNode[] } = {};
  
  items.forEach(item => {
    const newNode: MasterAccountNode = { ...item, children: [] };
    const parentCode = item.parent_code;

    if (parentCode) {
      if (!childrenOf[parentCode]) {
        childrenOf[parentCode] = [];
      }
      childrenOf[parentCode].push(newNode);
    } else {
      tree.push(newNode);
    }
  });

  const findAndSetChildren = (node: MasterAccountNode) => {
    if (childrenOf[node.code]) {
      node.children = childrenOf[node.code];
      node.children.forEach(findAndSetChildren);
    }
  };

  tree.forEach(findAndSetChildren);
  return tree;
};
