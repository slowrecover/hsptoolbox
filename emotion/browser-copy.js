(() => {
  const replacements = new Map([
    ['没有找到时，再用 Chrome 右上角菜单选择“安装应用”或“添加到主屏幕”。', '没有找到时，再打开当前浏览器菜单，选择“添加到主屏幕”“安装应用”或名称相近的选项。'],
    ['请确认使用安卓 Chrome 打开，然后点浏览器右上角菜单，选择“安装应用”或“添加到主屏幕”。', '请使用手机自带浏览器或常用浏览器打开，然后点浏览器菜单，选择“添加到主屏幕”“安装应用”或名称相近的选项。'],
    ['请从 Chrome 菜单安装', '请从浏览器菜单添加'],
    ['点浏览器右上角“⋮”，选择“安装应用”或“添加到主屏幕”。安装后在应用列表搜索“情绪记录本”。', '点浏览器菜单（通常是“⋮”或“更多”），选择“添加到主屏幕”“安装应用”或名称相近的选项。完成后可在应用列表搜索“情绪记录本”。'],
    ['可以重新打开此页面，再从 Chrome 右上角菜单选择“安装应用”或“添加到主屏幕”。', '可以重新打开此页面，再从浏览器菜单选择“添加到主屏幕”“安装应用”或名称相近的选项。']
  ]);

  function replaceText(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      let value = node.nodeValue;
      for (const [from, to] of replacements) value = value.replaceAll(from, to);
      node.nodeValue = value;
    }
  }

  replaceText();
  new MutationObserver(() => replaceText()).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
