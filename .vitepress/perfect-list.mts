/*
 * 自定义 Markdown-it 插件：
 * 支持 1) 和 (1) 的有序列表，并支持右对齐
 */

export function perfectList(md: any) {
  md.core.ruler.before('block', 'fancy_list_marker', (state: any) => {
    state.src = state.src.replace(/^(\s*)\((\d+)\)\s+/gm, '$1$2) <!--style:double|start:$2--> ');

    state.src = state.src.replace(/^(\s*)(\d+)\)\s+(?!<!--style:double)/gm, '$1$2) <!--style:single|start:$2--> ');
  });

  const defaultOpen = md.renderer.rules.ordered_list_open || function(tokens: any, idx: any, options: any, env: any, self: any) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.ordered_list_open = function(tokens: any, idx: any, options: any, env: any, self: any) {
    const token = tokens[idx];
    let listStyle = 'standard';
    let startNumber = 1;

    for (let i = idx + 1; i < tokens.length; i++) {
      if (tokens[i].type === 'ordered_list_close') break;

      if (tokens[i].content) {
        const match = tokens[i].content.match(/<!--style:(single|double)\|start:(\d+)-->/);
        if (match) {
          listStyle = match[1];
          startNumber = parseInt(match[2]);
          break; // 找到第一个列表项就可以退出了
        }
      }
    }

    // 清理所有暗号
    for (let i = idx + 1; i < tokens.length; i++) {
      if (tokens[i].type === 'ordered_list_close') break;

      if (tokens[i].content) {
        tokens[i].content = tokens[i].content.replace(/<!--style:(single|double)\|start:\d+-->/g, '');
        if (tokens[i].children) {
          tokens[i].children.forEach((child: any) => {
            if (child.content) child.content = child.content.replace(/<!--style:(single|double)\|start:\d+-->/g, '');
          });
        }
      }
    }

    if (listStyle === 'double') {
      token.attrSet('class', 'list-style-double-paren');
      // counter-reset 设置为 startNumber - 1，这样第一次 increment 后就是 startNumber
      token.attrSet('style', `counter-reset: double-counter ${startNumber - 1};`);
    } else if (listStyle === 'single') {
      token.attrSet('class', 'list-style-single-paren');
      token.attrSet('style', `counter-reset: single-counter ${startNumber - 1};`);
    }

    return defaultOpen(tokens, idx, options, env, self);
  };
}