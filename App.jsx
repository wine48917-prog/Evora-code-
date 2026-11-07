
import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { EditorView } from "@codemirror/view";
import JSZip from "jszip";
import {
  Code2,
  Play,
  Eye,
  FolderOpen,
  FilePlus,
  Download,
  Trash2,
  Smartphone,
  Monitor,
  Terminal,
  X,
  Menu,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Copy,
  Maximize2,
  Settings,
  Search,
  Files,
  Plus
} from "lucide-react";

const initialFiles = [
  {
    id: 1,
    name: "index.html",
    language: "html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My First Website</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="container">
    <h1>Welcome to EVORA CODE</h1>
    <p>Your coding journey starts here.</p>
    <button onclick="sayHello()">Get Started</button>
  </main>

  <script src="script.js"></script>
</body>
</html>`
  },
  {
    id: 2,
    name: "style.css",
    language: "css",
    content: `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #080d18;
  color: #eaf3ff;
  font-family: Arial, sans-serif;
}

.container {
  text-align: center;
  padding: 40px;
}

h1 {
  color: #72c9ff;
  font-size: 36px;
}

p {
  color: #9baec5;
}

button {
  background: #38a9ed;
  color: #06111d;
  border: 0;
  border-radius: 10px;
  padding: 13px 24px;
  cursor: pointer;
  font-weight: bold;
}`
  },
  {
    id: 3,
    name: "script.js",
    language: "javascript",
    content: `function sayHello() {
  alert("Welcome to EVORA CODE!");
  console.log("EVORA CODE is running!");
}`
  }
];

const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "#0b1220",
    color: "#dce9f8",
    fontSize: "14px",
    height: "100%"
  },
  ".cm-content": {
    fontFamily: "monospace",
    caretColor: "#64c9ff",
    paddingTop: "12px"
  },
  ".cm-gutters": {
    backgroundColor: "#0b1220",
    color: "#53647b",
    border: "none"
  },
  ".cm-activeLine": {
    backgroundColor: "#152238"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#152238"
  },
  "&.cm-focused": {
    outline: "none"
  },
  ".cm-cursor": {
    borderLeftColor: "#64c9ff"
  },
  ".cm-selectionBackground": {
    backgroundColor: "#25486b !important"
  }
});

function getLanguage(name) {
  const ext = name.split(".").pop().toLowerCase();

  if (ext === "html" || ext === "htm") return html();
  if (ext === "css") return css();
  if (ext === "js" || ext === "jsx" || ext === "ts") return javascript();
  if (ext === "json") return json();

  return [];
}

function App() {
  const [files, setFiles] = useState(() => {
    try {
      const saved = localStorage.getItem("evora-files");
      return saved ? JSON.parse(saved) : initialFiles;
    } catch {
      return initialFiles;
    }
  });

  const [activeId, setActiveId] = useState(1);
  const [activePanel, setActivePanel] = useState("editor");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState([]);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [device, setDevice] = useState("desktop");
  const [previewKey, setPreviewKey] = useState(0);

  const iframeRef = useRef(null);

  const activeFile = files.find(file => file.id === activeId) || files[0];

  useEffect(() => {
    localStorage.setItem("evora-files", JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    function receiveMessage(event) {
      if (event.data?.source !== "evora-console") return;

      setConsoleMessages(prev => [
        ...prev.slice(-99),
        {
          type: event.data.type || "log",
          message: String(event.data.message),
          time: new Date().toLocaleTimeString()
        }
      ]);
    }

    window.addEventListener("message", receiveMessage);
    return () => window.removeEventListener("message", receiveMessage);
  }, []);

  const updateCode = value => {
    setFiles(prev =>
      prev.map(file =>
        file.id === activeId ? { ...file, content: value } : file
      )
    );
  };

  const createFile = () => {
    const name = newFileName.trim();

    if (!name) return;
    if (files.some(file => file.name === name)) {
      alert("A file with this name already exists.");
      return;
    }

    const ext = name.split(".").pop().toLowerCase();
    let language = "text";

    if (ext === "html") language = "html";
    if (ext === "css") language = "css";
    if (["js", "jsx", "ts"].includes(ext)) language = "javascript";
    if (ext === "json") language = "json";

    const newFile = {
      id: Date.now(),
      name,
      language,
      content: ""
    };

    setFiles(prev => [...prev, newFile]);
    setActiveId(newFile.id);
    setNewFileName("");
    setNewFileOpen(false);
    setActivePanel("editor");
  };

  const deleteFile = id => {
    if (files.length <= 1) {
      alert("You must keep at least one file.");
      return;
    }

    const file = files.find(item => item.id === id);
    if (!window.confirm(`Delete ${file?.name}?`)) return;

    const remaining = files.filter(item => item.id !== id);
    setFiles(remaining);

    if (activeId === id) {
      setActiveId(remaining[0].id);
    }
  };

  const buildPreview = () => {
    const htmlFile = files.find(file => file.name === "index.html");
    const cssFile = files.find(file => file.name === "style.css");
    const jsFile = files.find(file => file.name === "script.js");

    let output = htmlFile?.content || "<h1>No index.html file found</h1>";

    if (cssFile) {
      const styleTag = `<style>${cssFile.content.replace(/<\/style/gi, "<\\/style")}</style>`;

      if (output.includes("</head>")) {
        output = output.replace("</head>", `${styleTag}</head>`);
      } else {
        output = styleTag + output;
      }
    }

    if (jsFile) {
      const bridge = `
<script>
(function() {
  const send = (type, args) => {
    parent.postMessage({
      source: "evora-console",
      type,
      message: args.map(item => {
        try {
          return typeof item === "object"
            ? JSON.stringify(item)
            : String(item);
        } catch {
          return String(item);
        }
      }).join(" ")
    }, "*");
  };

  ["log", "warn", "error", "info"].forEach(type => {
    const original = console[type];
    console[type] = function(...args) {
      send(type, args);
      original.apply(console, args);
    };
  });

  window.addEventListener("error", event => {
    send("error", [event.message]);
  });
})();
<\/script>`;

      const scriptTag = `<script>${jsFile.content.replace(/<\/script/gi, "<\\/script")}<\/script>`;

      if (output.includes("</body>")) {
        output = output.replace("</body>", `${bridge}${scriptTag}</body>`);
      } else {
        output += bridge + scriptTag;
      }
    }

    return output;
  };

  const runCode = () => {
    setConsoleMessages([]);
    setActivePanel("preview");
    setConsoleOpen(true);
    setPreviewKey(prev => prev + 1);
  };

  const downloadProject = async () => {
    const zip = new JSZip();

    files.forEach(file => {
      zip.file(file.name, file.content);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "evora-project.zip";
    link.click();

    URL.revokeObjectURL(url);
  };

  const downloadCurrentFile = () => {
    if (!activeFile) return;

    const blob = new Blob([activeFile.content], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = activeFile.name;
    link.click();

    URL.revokeObjectURL(url);
  };

  const copyCode = async () => {
    if (!activeFile) return;

    try {
      await navigator.clipboard.writeText(activeFile.content);
      alert("Code copied!");
    } catch {
      alert("Could not copy code.");
    }
  };

  const resetProject = () => {
    if (!window.confirm("Reset the project to its original files?")) return;

    setFiles(initialFiles);
    setActiveId(1);
    setConsoleMessages([]);
  };

  const editorExtensions = useMemo(
    () => [editorTheme, getLanguage(activeFile?.name || "")],
    [activeFile?.name]
  );

  return (
    <div className="evora-app">

      <header className="topbar">
        <button
          className="brand"
          onClick={() => setMobileMenu(!mobileMenu)}
          title="Toggle menu"
        >
          <span className="brand-icon"><Code2 size={21} /></span>
          <span>EVORA <b>CODE</b></span>
          <small>V2</small>
        </button>

        <div className="top-actions">
          <button className="icon-btn" onClick={copyCode} title="Copy code">
            <Copy size={17} />
          </button>

          <button className="icon-btn" onClick={downloadCurrentFile} title="Download file">
            <Download size={17} />
          </button>

          <button className="icon-btn" onClick={downloadProject} title="Export project ZIP">
            <FolderOpen size={17} />
          </button>

          <button className="run-btn" onClick={runCode}>
            <Play size={15} fill="currentColor" />
            <span>Run</span>
          </button>
        </div>
      </header>

      <div className="workspace">

        <aside className={`sidebar ${sidebarOpen ? "open" : "closed"} ${mobileMenu ? "mobile-open" : ""}`}>
          <div className="sidebar-heading">
            <span>EXPLORER</span>
            <div>
              <button className="tiny-btn" onClick={() => setNewFileOpen(true)} title="New file">
                <FilePlus size={16} />
              </button>
              <button className="tiny-btn" onClick={resetProject} title="Reset project">
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          <div className="project-label">
            <ChevronDown size={15} />
            <FolderOpen size={15} />
            <span>MY PROJECT</span>
          </div>

          <div className="file-list">
            {files.map(file => (
              <div
                key={file.id}
                className={`file-item ${activeId === file.id ? "selected" : ""}`}
                onClick={() => {
                  setActiveId(file.id);
                  setActivePanel("editor");
                  setMobileMenu(false);
                }}
              >
                <span className={`file-dot ${file.language}`}></span>
                <span className="file-name">{file.name}</span>
                <button
                  className="delete-file"
                  onClick={event => {
                    event.stopPropagation();
                    deleteFile(file.id);
                  }}
                  title="Delete file"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="sidebar-bottom">
            <div className="sidebar-status">
              <span className="status-dot"></span>
              Local project
            </div>
            <div className="sidebar-count">{files.length} files</div>
          </div>
        </aside>

        <main className="main-area">

          <div className="toolbar">
            <button
              className="toolbar-btn sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle explorer"
            >
              <Files size={17} />
            </button>

            <div className="tabs">
              {files.map(file => (
                <button
                  key={file.id}
                  className={`tab ${activeId === file.id ? "active" : ""}`}
                  onClick={() => {
                    setActiveId(file.id);
                    setActivePanel("editor");
                  }}
                >
                  <span className={`file-dot ${file.language}`}></span>
                  {file.name}
                  {activeId === file.id && <span className="tab-indicator"></span>}
                </button>
              ))}
            </div>

            <div className="toolbar-right">
              <button
                className={`toolbar-btn ${activePanel === "editor" ? "active-tool" : ""}`}
                onClick={() => setActivePanel("editor")}
                title="Editor"
              >
                <Code2 size={17} />
              </button>

              <button
                className={`toolbar-btn ${activePanel === "preview" ? "active-tool" : ""}`}
                onClick={() => setActivePanel("preview")}
                title="Preview"
              >
                <Eye size={17} />
              </button>
            </div>
          </div>

          <div className="editor-heading">
            <div className="breadcrumb">
              <span>MY PROJECT</span>
              <ChevronRight size={13} />
              <b>{activeFile?.name}</b>
            </div>

            <div className="editor-actions">
              <span className="language-label">{activeFile?.language || "text"}</span>
              <button className="tiny-btn" onClick={copyCode} title="Copy">
                <Copy size={15} />
              </button>
              <button className="tiny-btn" onClick={downloadCurrentFile} title="Download">
                <Download size={15} />
              </button>
            </div>
          </div>

          {activePanel === "editor" ? (
            <div className="code-editor">
              {activeFile && (
                <CodeMirror
                  value={activeFile.content}
                  height="100%"
                  theme="dark"
                  extensions={editorExtensions}
                  onChange={updateCode}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                    autocompletion: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    searchKeymap: true,
                    tabSize: 2
                  }}
                />
              )}
            </div>
          ) : (
            <div className="preview-area">
              <div className="preview-toolbar">
                <div className="preview-address">
                  <span className="live-dot"></span>
                  <span>localhost / preview</span>
                </div>

                <div className="preview-controls">
                  <button
                    className={device === "mobile" ? "selected-device" : ""}
                    onClick={() => setDevice("mobile")}
                    title="Mobile preview"
                  >
                    <Smartphone size={16} />
                  </button>
                  <button
                    className={device === "desktop" ? "selected-device" : ""}
                    onClick={() => setDevice("desktop")}
                    title="Desktop preview"
                  >
                    <Monitor size={16} />
                  </button>
                  <button onClick={() => setPreviewKey(prev => prev + 1)} title="Refresh preview">
                    <RefreshCw size={15} />
                  </button>
                  <button onClick={() => {
                    const html = buildPreview();
                    const blob = new Blob([html], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    window.open(url, "_blank");
                  }} title="Open in new tab">
                    <Maximize2 size={15} />
                  </button>
                </div>
              </div>

              <div className="preview-canvas">
                <iframe
                  key={previewKey}
                  ref={iframeRef}
                  title="EVORA Preview"
                  className={`preview-frame ${device}`}
                  srcDoc={buildPreview()}
                  sandbox="allow-scripts allow-forms allow-modals allow-popups"
                />
              </div>
            </div>
          )}

          {consoleOpen && (
            <section className="console-panel">
              <div className="console-heading">
                <div>
                  <Terminal size={15} />
                  <span>CONSOLE</span>
                  <small>{consoleMessages.length}</small>
                </div>
                <div>
                  <button
                    className="tiny-btn"
                    onClick={() => setConsoleMessages([])}
                    title="Clear console"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    className="tiny-btn"
                    onClick={() => setConsoleOpen(false)}
                    title="Close console"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="console-output">
                {consoleMessages.length === 0 ? (
                  <div className="console-empty">Console is ready. Run your code to see messages.</div>
                ) : (
                  consoleMessages.map((item, index) => (
                    <div className={`console-line ${item.type}`} key={index}>
                      <span>{item.time}</span>
                      <b>{item.type.toUpperCase()}</b>
                      <code>{item.message}</code>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          <footer className="statusbar">
            <div>
              <span className="status-dot"></span>
              Ready
              <span className="status-divider">|</span>
              {activeFile?.language || "text"}
            </div>
            <div>
              UTF-8
              <span className="status-divider">|</span>
              LF
              <span className="status-divider">|</span>
              EVORA V2
            </div>
          </footer>

        </main>
      </div>

      {newFileOpen && (
        <div className="modal-backdrop" onClick={() => setNewFileOpen(false)}>
          <div className="new-file-modal" onClick={event => event.stopPropagation()}>
            <div className="modal-title">
              <div>
                <FilePlus size={19} />
                <b>Create New File</b>
              </div>
              <button className="tiny-btn" onClick={() => setNewFileOpen(false)}>
                <X size={17} />
              </button>
            </div>

            <label>File name</label>
            <input
              autoFocus
              placeholder="example.js"
              value={newFileName}
              onChange={event => setNewFileName(event.target.value)}
              onKeyDown={event => event.key === "Enter" && createFile()}
            />

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setNewFileOpen(false)}>
                Cancel
              </button>
              <button className="create-btn" onClick={createFile}>
                <Plus size={15} />
                Create file
              </button>
            </div>
          </div>
        </div>
           <div className="copyright">
        © 2026 WINE 🍷 — All Rights Reserved.
      </div>
    </div>
  );
}

export default App;