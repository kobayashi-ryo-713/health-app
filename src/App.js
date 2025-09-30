import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // コードハイライト用スタイル
import './App.css';

function App() {
  // 入力状態（変更なし）
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // 計算結果状態（変更なし）
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState('');

  // AIアドバイス状態（変更なし）
  const [healthAdvice, setHealthAdvice] = useState('');
  const [foodAdvice, setFoodAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  // 入力変更ハンドラ（変更なし）
  const handleInputChange = (e, setter) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setter(value);
  };

  // 画像選択ハンドラ（変更なし）
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('画像は5MB以下にしてください。');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // BMI計算関数（変更なし）
  const calculateBMI = () => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
      alert('有効な身長と体重を入力してください。');
      return;
    }
    const calculatedBmi = w / (h * h);
    setBmi(calculatedBmi.toFixed(2));
    if (calculatedBmi < 18.5) setBmiCategory('低体重');
    else if (calculatedBmi < 25) setBmiCategory('普通体重');
    else if (calculatedBmi < 30) setBmiCategory('体重過多');
    else setBmiCategory('肥満');
  };

  // 一般的な健康アドバイス（Gemini 2.0 Flash版）
  const getHealthAdvice = async () => {
    if (!bmi) {
      alert('まず身長と体重を入力してBMIを計算してください。');
      return;
    }
    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel(
        { model: 'gemini-2.0-flash' }, // モデル名をGemini 2.0 Flashに更新
        { apiVersion: 'v1' } // 安定版v1を維持
      );
      const prompt = `ユーザーの身長: ${height}cm、体重: ${weight}kg、年齢: ${age}歳、BMI: ${bmi} (${bmiCategory})。この情報から健康状態を判定し、日本語で簡潔なアドバイスをマークダウン形式で提供してください。アドバイスは励ましを交え、箇条書きで具体的な生活改善策を提案。`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setHealthAdvice(response.text());
    } catch (error) {
      console.error('Gemini APIエラー:', error);
      setHealthAdvice('アドバイス生成中にエラーが発生しました。APIキーを確認してください。');
    }
    setLoading(false);
  };

  // 食べ物アドバイス（Gemini 2.0 Flash版: 画像対応）
  const getFoodAdvice = async () => {
    if (!bmi || !imageFile) {
      alert('BMIを計算し、画像をアップロードしてください。');
      return;
    }
    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel(
        { model: 'gemini-2.0-flash' }, // モデル名をGemini 2.0 Flashに更新
        { apiVersion: 'v1' } // 安定版v1を維持
      );

      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      const base64Image = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
      });

      const prompt = `以下の画像を確認し、それが食べ物かどうかを判定してください。食べ物の場合、ユーザーの身長: ${height}cm、体重: ${weight}kg、年齢: ${age}歳、BMI: ${bmi} (${bmiCategory})を考慮して、その食べ物が健康に適しているか、日本語でマークダウン形式のアドバイスを提供。箇条書きで励ましと代替案を提案。食べ物でない場合はその旨を通知。`;

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: imageFile.type,
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      setFoodAdvice(response.text());
    } catch (error) {
      console.error('Gemini APIエラー:', error);
      setFoodAdvice('画像分析中にエラーが発生しました。APIキーを確認してください。');
    }
    setLoading(false);
  };

  // UI部分（変更なし、ボタンテキストをGemini 2.0 Flashに更新）
  return (
    <div className="App">
      <h1>健康管理アプリ</h1>

      {/* 入力フォーム（変更なし） */}
      <div className="input-form">
        <label>
          身長 (cm):
          <input
            type="text"
            value={height}
            onChange={(e) => handleInputChange(e, setHeight)}
            placeholder="例: 170"
          />
        </label>
        <br />
        <label>
          体重 (kg):
          <input
            type="text"
            value={weight}
            onChange={(e) => handleInputChange(e, setWeight)}
            placeholder="例: 65"
          />
        </label>
        <br />
        <label>
          年齢 (歳):
          <input
            type="text"
            value={age}
            onChange={(e) => handleInputChange(e, setAge)}
            placeholder="例: 30"
          />
        </label>
        <br />
        <button onClick={calculateBMI}>BMIを計算</button>
      </div>

      {/* 画像アップロード（変更なし） */}
      <div className="image-upload">
        <label>
          画像を選択:
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </label>
      </div>

      {/* 画像プレビュー（変更なし） */}
      {image && (
        <div className="image-preview">
          <h3>アップロード画像:</h3>
          <img src={image} alt="アップロードされた画像" />
        </div>
      )}

      {/* BMI結果表示（変更なし） */}
      {bmi && (
        <div className="bmi-result">
          <h3>BMI結果</h3>
          <p>BMI: {bmi}</p>
          <p>分類: {bmiCategory}</p>
        </div>
      )}

      {/* 健康アドバイスボタン */}
      {bmi && (
        <div className="advice-section">
          <button onClick={getHealthAdvice} disabled={loading}>
            {loading ? '生成中...' : '健康アドバイスを取得 (Gemini 2.0 Flash)'}
          </button>
        </div>
      )}

      {/* 健康アドバイス表示（変更なし） */}
      {healthAdvice && (
        <div className="advice-result">
          <h3>AI健康アドバイス</h3>
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{healthAdvice}</ReactMarkdown>
        </div>
      )}

      {/* 食べ物アドバイスボタン */}
      {bmi && image && (
        <div className="advice-section">
          <button onClick={getFoodAdvice} disabled={loading}>
            {loading ? '分析中...' : '食べ物アドバイスを取得 (Gemini 2.0 Flash)'}
          </button>
        </div>
      )}

      {/* 食べ物アドバイス表示（変更なし） */}
      {foodAdvice && (
        <div className="advice-result">
          <h3>AI食べ物アドバイス</h3>
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{foodAdvice}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default App;