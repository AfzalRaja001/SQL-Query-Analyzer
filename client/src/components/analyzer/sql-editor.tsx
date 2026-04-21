'use client';

import Editor, { OnMount } from '@monaco-editor/react';
import { useRef } from 'react';

// Mocking the system table schema for a perfect demo
const DB_SCHEMA: any = {
  tables: ['information_schema.tables', 'information_schema.columns'],
  details: {
    'information_schema.tables': "Built-in PostgreSQL system view containing all tables in the current database.\n\n**Common Columns:**\n- table_name (VARCHAR)\n- table_schema (VARCHAR)\n- table_type (VARCHAR)\n- self_referencing_column_name (VARCHAR)",
    'information_schema.columns': "Built-in view containing information about all columns in the database.\n\n**Common Columns:**\n- column_name (VARCHAR)\n- data_type (VARCHAR)\n- is_nullable (YES/NO)"
  },
  columns: {
    'information_schema.tables': ['table_name', 'table_schema', 'table_type', 'table_catalog'],
    'information_schema.columns': ['column_name', 'table_name', 'data_type', 'ordinal_position']
  }
};

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function SqlEditor({ value, onChange }: SqlEditorProps) {
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // 1. AUTOCOMPLETE DROPDOWN
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          ...['SELECT', 'FROM', 'WHERE', 'JOIN', 'LIMIT', 'ORDER BY'].map(k => ({
            label: k,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: k,
            range: range,
          })),
          ...DB_SCHEMA.tables.map((table: string) => ({
            label: table,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: table,
            detail: 'System View',
            range: range,
          })),
          ...Object.values(DB_SCHEMA.columns).flat().map((col: any) => ({
            label: col,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: col,
            detail: 'Column',
            range: range,
          }))
        ];
        return { suggestions };
      },
    });

    // 2. CUSTOM HOVER PROVIDER
    monaco.languages.registerHoverProvider('sql', {
      provideHover: (model: any, position: any) => {
        const lineContent = model.getLineContent(position.lineNumber);
        // We look for the full "information_schema.tables" string if the mouse is over it
        const word = model.getWordAtPosition(position);
        if (!word) return;

        // Check for specific match in our schema
        const foundTable = DB_SCHEMA.tables.find(
          (t: string) => lineContent.toLowerCase().includes(t.toLowerCase()) && 
                         t.toLowerCase().includes(word.word.toLowerCase())
        );

        if (foundTable) {
          return {
            contents: [
              { value: `**System View: ${foundTable}**` },
              { value: DB_SCHEMA.details[foundTable] }
            ],
          };
        }
      },
    });

    validate(editor.getValue(), editor, monaco);
  };

  const validate = (code: string, editor: any, monaco: any) => {
    const model = editor.getModel();
    if (!model) return;
    const markers: any[] = [];
    const fullContent = code.toUpperCase();
    
    if (fullContent.includes("SELECT") && !fullContent.includes("FROM")) {
      markers.push({
        message: "Syntax Error: SELECT statement missing FROM clause.",
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 100,
      });
    }

    if (fullContent.includes("*")) {
      const lines = code.split('\n');
      lines.forEach((line, index) => {
        if (line.includes("*")) {
          markers.push({
            message: "Performance Hint: Using '*' is inefficient. Specify column names.",
            severity: monaco.MarkerSeverity.Info,
            startLineNumber: index + 1,
            startColumn: line.indexOf("*") + 1,
            endLineNumber: index + 1,
            endColumn: line.indexOf("*") + 2,
          });
        }
      });
    }
    monaco.editor.setModelMarkers(model, "sql-linter", markers);
  };

  return (
    <div className="min-h-[300px] w-full rounded-md border bg-[#1e1e1e] overflow-hidden">
      <Editor
        height="300px"
        defaultLanguage="sql"
        theme="vs-dark"
        value={value}
        onChange={(v) => {
          onChange(v || "");
          if (editorRef.current && monacoRef.current) {
            validate(v || "", editorRef.current, monacoRef.current);
          }
        }}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          suggestOnTriggerCharacters: true,
          hover: { enabled: true, delay: 300 },
        }}
      />
    </div>
  );
}