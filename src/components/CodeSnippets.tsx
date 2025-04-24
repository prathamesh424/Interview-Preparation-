import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { CodeSnippet } from '../types/supabase';
import { Button, Input, Select, message } from 'antd';
import { CodeOutlined, SaveOutlined } from '@ant-design/icons';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface CodeSnippetsProps {
  interviewId: string;
  userId: string;
  userName: string;
}

const CodeSnippets: React.FC<CodeSnippetsProps> = ({ interviewId, userId, userName }) => {
  const supabase = useSupabaseClient();
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [newSnippet, setNewSnippet] = useState({
    title: '',
    code: '',
    language: 'javascript',
  });

  useEffect(() => {
    fetchSnippets();
  }, [interviewId]);

  const fetchSnippets = async () => {
    const { data, error } = await supabase
      .from('code_snippets')
      .select('*')
      .eq('interview_id', interviewId)
      .order('timestamp', { ascending: true });

    if (error) {
      message.error('Failed to fetch code snippets');
      return;
    }

    setSnippets(data || []);
  };

  const handleSaveSnippet = async () => {
    if (!newSnippet.title || !newSnippet.code) {
      message.warning('Please fill in all fields');
      return;
    }

    const { error } = await supabase.from('code_snippets').insert({
      interview_id: interviewId,
      title: newSnippet.title,
      code: newSnippet.code,
      language: newSnippet.language,
      timestamp: Date.now(),
      user_id: userId,
      user_name: userName,
    });

    if (error) {
      message.error('Failed to save code snippet');
      return;
    }

    message.success('Code snippet saved successfully');
    setNewSnippet({ title: '', code: '', language: 'javascript' });
    fetchSnippets();
  };

  return (
    <div className="code-snippets-container">
      <div className="new-snippet-form">
        <Input
          placeholder="Snippet Title"
          value={newSnippet.title}
          onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
          prefix={<CodeOutlined />}
        />
        <Select
          value={newSnippet.language}
          onChange={(value) => setNewSnippet({ ...newSnippet, language: value })}
          style={{ width: 120 }}
        >
          <Select.Option value="javascript">JavaScript</Select.Option>
          <Select.Option value="python">Python</Select.Option>
          <Select.Option value="java">Java</Select.Option>
          <Select.Option value="cpp">C++</Select.Option>
        </Select>
        <Input.TextArea
          placeholder="Enter your code here"
          value={newSnippet.code}
          onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
          rows={4}
        />
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSaveSnippet}
        >
          Save Snippet
        </Button>
      </div>

      <div className="snippets-list">
        {snippets.map((snippet) => (
          <div key={snippet.id} className="snippet-item">
            <h4>{snippet.title}</h4>
            <p className="snippet-meta">
              By {snippet.user_name} at {new Date(snippet.timestamp).toLocaleString()}
            </p>
            <SyntaxHighlighter language={snippet.language} style={docco}>
              {snippet.code}
            </SyntaxHighlighter>
          </div>
        ))}
      </div>

      <style jsx>{`
        .code-snippets-container {
          padding: 20px;
        }

        .new-snippet-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .snippets-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .snippet-item {
          border: 1px solid #e8e8e8;
          border-radius: 4px;
          padding: 15px;
        }

        .snippet-meta {
          color: #666;
          font-size: 0.9em;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
};

export default CodeSnippets; 