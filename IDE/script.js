// CodeMirror Custom Mode
CodeMirror.defineSimpleMode("ejp", {
    start: [
        {regex: /##.*/, token: "comment"},
        {regex: /"(?:[^\\]|\\.)*?"/, token: "string"},
        {regex: /(?:def|sv|rep|canva|log)(?=\()/, token: "keyword"},
        {regex: /[a-zA-Z0-9_]+(?=\()/, token: "variable-3"}, 
        {regex: /%[a-zA-Z0-9_-]+%/, token: "variable-2"},
        {regex: /\{/, indent: true},
        {regex: /\}/, dedent: true}
    ]
});

var editor = CodeMirror.fromTextArea(document.getElementById("editor-text"), {
    lineNumbers: true,
    mode: "ejp",
    theme: "dracula",
    tabSize: 4,
    indentUnit: 4,
    lineWrapping: true,
    matchBrackets: true
});
window.editor = editor;

function downloadSource() {
    const text = window.editor.getValue();
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = document.getElementById('filename').value;
    a.click();
}

window.saveBinaryFile = function(pyBytearray, filename) {
    const uint8Array = new Uint8Array(pyBytearray);
    const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}