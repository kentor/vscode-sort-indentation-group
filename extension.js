const vscode = require('vscode');

exports.activate = function activate(context) {
  const disposable = vscode.commands.registerTextEditorCommand(
    'extension.sort',
    textEditorCommandCallback
  );

  context.subscriptions.push(disposable);

  function getLinesFromCursor(selection) {
    const editor = vscode.window.activeTextEditor;

    const position = selection.active;

    const currentLine = position.line;
    const currentTextLine = editor.document.lineAt(currentLine);

    // get current line's indentation characters
    const indentation = (currentTextLine.text.match(/(^\s+)/) || [''])[0];
    const indentationRE = new RegExp(`^${indentation}\\S`);

    // get lines around this line with the same indentation
    const textLines = [currentTextLine];
    let firstTextLine = currentTextLine;
    let lastTextLine = currentTextLine;

    for (let i = currentLine - 1; i >= 0; i--) {
      const textLine = editor.document.lineAt(i);
      if (textLine.isEmptyOrWhitespace || !indentationRE.test(textLine.text)) {
        break;
      }
      firstTextLine = textLine;
      textLines.push(textLine);
    }

    for (let i = currentLine + 1; i < editor.document.lineCount; i++) {
      const textLine = editor.document.lineAt(i);
      if (textLine.isEmptyOrWhitespace || !indentationRE.test(textLine.text)) {
        break;
      }
      lastTextLine = textLine;
      textLines.push(textLine);
    }

    return { textLines, firstTextLine, lastTextLine };
  }

  function getLinesInSelection(selection) {
    const editor = vscode.window.activeTextEditor;

    const textLines = [];

    for (let i = selection.start.line; i <= selection.end.line; i++) {
      textLines.push(editor.document.lineAt(i));
    }

    const firstTextLine = textLines[0];
    const lastTextLine = textLines[textLines.length - 1];

    return { textLines, firstTextLine, lastTextLine };
  }

  function textEditorCommandCallback(textEditor, edit) {
    const editor = vscode.window.activeTextEditor;

    if (!editor) return;

    const selection = editor.selection;
    const getLines =
      selection.isEmpty ? getLinesFromCursor : getLinesInSelection;

    const { textLines, firstTextLine, lastTextLine } = getLines(selection);

    // sort the lines
    textLines.sort((a, b) => {
      return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
    });

    // replace the lines
    const replacement = textLines.map(l => l.text).join('\n');
    const replacementRange = firstTextLine.range.union(lastTextLine.range);
    edit.replace(replacementRange, replacement);
  }
};

exports.deactivate = function deactivate() {};
