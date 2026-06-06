"use strict";

const app = document.querySelector("#app");

const state = {
  imageFile: null,
  imageUrl: "",
  imageElement: null,
  exifFound: false,
  selectedPreset: "soft-side-spec",
  selectedSize: "original",
  selectedRatio: "auto",
  quality: 0.92,
  isDragging: false,
  controls: {
    textX: 0,
    textY: 0,
    textScale: 1,
    photoScale: 1,
    photoX: 0,
    photoY: 0,
    bgScale: 1.04,
    bgX: 0,
    bgY: 0,
    blurAmount: 12,
    blurOpacity: 0.38,
  },
  selectedLayerId: "",
  layerControls: {},
  customTexts: [],
  data: blankExif(),
};

const presets = [
  { id: "soft-side-spec", name: "01 Soft Side Spec", desc: "白余白＋左スペック" },
  { id: "black-cinema", name: "02 Black Cinema", desc: "黒帯＋右下スペック" },
  { id: "blur-vertical", name: "03 Blur Vertical", desc: "背景ぼかし＋縦写真" },
  { id: "frost-frame", name: "04 Frost Frame", desc: "淡い背景＋白フレーム" },
  { id: "dark-border", name: "05 Dark Border", desc: "黒背景＋白罫線" },
  { id: "tokyo-editorial", name: "06 Tokyo Editorial", desc: "雑誌風サイドタイトル" },
  { id: "city-overlay", name: "07 City Overlay", desc: "写真全面＋地名" },
  { id: "gallery-print", name: "08 Gallery Print", desc: "展示プリント風" },
  { id: "polaroid-title", name: "09 Polaroid Title", desc: "ポラロイド＋地名" },
  { id: "mono-caption", name: "10 Mono Caption", desc: "モノクロ写真下キャプション" },
  { id: "gear-split", name: "11 Gear Split", desc: "機材アイコン風左右配置" },
  { id: "paper-spec", name: "12 Paper Spec", desc: "紙面左スペック＋写真" },
  { id: "travel-story", name: "13 Travel Story", desc: "縦写真＋下部地名" },
  { id: "hongkong-polaroid", name: "14 Hong Kong Polaroid", desc: "白紙ポラロイド" },
  { id: "night-matte", name: "15 Night Matte", desc: "暗いマット＋下部情報" },
  { id: "clean-shadow", name: "16 Clean Shadow", desc: "白余白＋影付き写真" },
  { id: "glass-center", name: "17 Glass Center", desc: "ぼかし背景＋中央写真" },
];

const exportSizes = {
  original: { label: "Original", width: 0, height: 0 },
  instagramPost: { label: "Instagram Post 1080x1080", width: 1080, height: 1080 },
  instagramStory: { label: "Instagram Story 1080x1920", width: 1080, height: 1920 },
  twitter: { label: "X / Twitter 1600x900", width: 1600, height: 900 },
  youtube: { label: "YouTube Thumbnail 1280x720", width: 1280, height: 720 },
};

const previewRatios = {
  auto: { label: "写真に合わせる", ratio: 0 },
  "1:1": { label: "1:1 正方形", ratio: 1 },
  "4:3": { label: "4:3", ratio: 4 / 3 },
  "3:4": { label: "3:4 縦", ratio: 3 / 4 },
  "16:9": { label: "16:9", ratio: 16 / 9 },
  "9:16": { label: "9:16 縦", ratio: 9 / 16 },
  "3:2": { label: "3:2", ratio: 3 / 2 },
  "2:3": { label: "2:3 縦", ratio: 2 / 3 },
};

function blankExif() {
  return {
    maker: "",
    camera: "",
    lens: "",
    focalLength: "",
    fNumber: "",
    shutterSpeed: "",
    iso: "",
    date: "",
    exposureBias: "",
    whiteBalance: "",
    location: "",
    gps: "",
    comment: "",
  };
}

function App() {
  app.innerHTML = `
    <main class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="mark" aria-hidden="true">PS</div>
          <div>
            <h1>PhotoSpec Studio</h1>
            <p>写真に、撮影情報という美しさを。</p>
          </div>
        </div>
        ${state.imageUrl ? `<button class="ghost-btn" data-action="reset">別の写真</button>` : ""}
      </header>
      ${state.imageUrl ? Editor() : Home()}
    </main>
  `;
  bindEvents();
}

function Home() {
  return `
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow">Local EXIF Composer</div>
        <h2>撮影データを、SNSに映える一枚へ。</h2>
        <p>JPEG / PNG / HEICをブラウザ上で読み込み、EXIFからカメラ、レンズ、撮影設定を抽出します。サーバー保存なしで、編集からPNG書き出しまで完結します。</p>
        <div class="feature-row">
          <span class="chip">ブラウザ内処理</span>
          <span class="chip">EXIF自動解析</span>
          <span class="chip">17プリセット</span>
          <span class="chip">PNGダウンロード</span>
        </div>
      </div>
      <div class="upload-card">${UploadArea()}</div>
    </section>
  `;
}

function Editor() {
  return `
    <section class="editor">
      <div class="preview-panel">
        <div class="preview-toolbar">
          <div>
            <h2>完成プレビュー</h2>
            <p>${presetName()} / ${previewRatios[state.selectedRatio].label} / ${exportSizes[state.selectedSize].label}</p>
          </div>
          <button class="icon-btn" title="PNGを書き出す" data-action="download">↓</button>
        </div>
        ${DesignPreview()}
      </div>
      <aside class="side-panel">
        ${ExifPanel()}
        ${EditForm()}
        ${DesignControls()}
        ${PresetSelector()}
        ${ExportPanel()}
      </aside>
    </section>
  `;
}

function UploadArea() {
  return `
    <label class="dropzone ${state.isDragging ? "is-dragging" : ""}" data-dropzone>
      <input class="file-input" type="file" accept="image/jpeg,image/jpg,image/png,image/heic,image/heif" data-file-input />
      <div>
        <strong>写真をアップロード</strong>
        <span>ドラッグ&ドロップ、またはボタンから選択してください。画像は外部サーバーへ送信されません。</span>
        <button class="primary-btn" type="button" data-action="pick-file">写真を選択</button>
        <button class="ghost-btn demo-btn" type="button" data-action="demo">デモで試す</button>
      </div>
    </label>
  `;
}

function ExifPanel() {
  const d = state.data;
  return `
    <section class="panel-section">
      <div class="panel-header">
        <div>
          <h2>EXIF情報</h2>
          <p>${state.exifFound ? "読み取り済み。必要に応じて編集できます。" : "EXIF情報が見つかりません。手入力できます。"}</p>
        </div>
      </div>
      ${!state.exifFound ? `<div class="notice">EXIF情報が見つかりません。SNSや編集アプリで削除された画像でも、下のフォームから情報を入力して作成できます。</div>` : ""}
      <div class="status-line">
        Camera: ${escapeHtml(d.camera || "未入力")}<br />
        Lens: ${escapeHtml(d.lens || "未入力")}<br />
        Settings: ${escapeHtml(settingsLine())}<br />
        Date: ${escapeHtml(d.date || "未入力")}
      </div>
    </section>
  `;
}

function EditForm() {
  const d = state.data;
  const fields = [
    ["camera", "カメラ名", d.camera],
    ["lens", "レンズ名", d.lens],
    ["focalLength", "焦点距離", d.focalLength],
    ["fNumber", "F値", d.fNumber],
    ["shutterSpeed", "シャッター", d.shutterSpeed],
    ["iso", "ISO", d.iso],
    ["date", "撮影日時", d.date],
    ["location", "撮影地", d.location],
  ];
  return `
    <section class="panel-section">
      <div class="panel-header">
        <div>
          <h2>編集</h2>
          <p>表示したい内容に整えます。</p>
        </div>
      </div>
      <div class="field-grid">
        ${fields.map(([key, label, value]) => Field(key, label, value)).join("")}
        ${Field("comment", "コメント", d.comment, true)}
      </div>
    </section>
  `;
}

function Field(key, label, value, full = false) {
  const tag = key === "comment" ? "textarea" : "input";
  const valueAttr = tag === "input" ? `value="${escapeAttr(value)}"` : "";
  const body = tag === "textarea" ? `${escapeHtml(value || "")}</textarea>` : "";
  return `
    <div class="field ${full ? "full" : ""}">
      <label for="${key}">${label}</label>
      <${tag} id="${key}" data-field="${key}" ${valueAttr}>${body}
    </div>
  `;
}

function PresetSelector() {
  return `
    <section class="panel-section">
      <div class="panel-header">
        <div>
          <h2>プリセット</h2>
          <p>クリックで即時反映します。</p>
        </div>
      </div>
      <div class="preset-grid">
        ${presets
          .map(
            (preset) => `
              <button class="preset-tile ${state.selectedPreset === preset.id ? "is-active" : ""}" data-preset="${preset.id}">
                <div class="thumb thumb-${preset.id}"></div>
                <strong>${preset.name}</strong>
                <small>${preset.desc}</small>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function ExportPanel() {
  return `
    <section class="panel-section">
      <div class="panel-header">
        <div>
          <h2>書き出し</h2>
          <p>PNG形式で保存します。</p>
        </div>
      </div>
      <div class="field full">
        <label for="ratio">完成プレビュー比率</label>
        <select id="ratio" data-ratio>
          ${Object.entries(previewRatios)
            .map(([key, item]) => `<option value="${key}" ${state.selectedRatio === key ? "selected" : ""}>${item.label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="field full">
        <label for="size">サイズ</label>
        <select id="size" data-size>
          ${Object.entries(exportSizes)
            .map(([key, item]) => `<option value="${key}" ${state.selectedSize === key ? "selected" : ""}>${item.label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="export-actions" style="margin-top:12px">
        <button class="primary-btn" data-action="download">PNGダウンロード</button>
      </div>
      <div class="status-line" data-export-status>iPhoneでは共有シートが開く場合があります。「画像を保存」を選ぶと写真に保存できます。</div>
    </section>
  `;
}

function DesignControls() {
  const c = state.controls;
  const selected = selectedLayerControls();
  const selectedCustom = state.customTexts.find((item) => item.id === state.selectedLayerId);
  return `
    <section class="panel-section">
      <div class="panel-header">
        <div>
          <h2>配置調整</h2>
          <p>文字をタップして選択。ドラッグで移動、2本指ピンチでサイズ変更できます。</p>
        </div>
      </div>
      <div class="field-grid control-grid">
        ${RangeField("textX", "選択文字 横位置", selected.textX, -50, 50, 1)}
        ${RangeField("textY", "選択文字 縦位置", selected.textY, -50, 50, 1)}
        ${RangeField("textScale", "選択文字サイズ", selected.textScale, 0.35, 3, 0.01)}
        ${RangeField("photoScale", "写真サイズ", c.photoScale, 0.55, 1.75, 0.01)}
        ${RangeField("photoX", "写真 横位置", c.photoX, -50, 50, 1)}
        ${RangeField("photoY", "写真 縦位置", c.photoY, -50, 50, 1)}
        ${RangeField("bgScale", "背景写真サイズ", c.bgScale, 1, 1.8, 0.01)}
        ${RangeField("bgX", "背景 横位置", c.bgX, -50, 50, 1)}
        ${RangeField("bgY", "背景 縦位置", c.bgY, -50, 50, 1)}
        ${RangeField("blurAmount", "背景ぼかし", c.blurAmount, 0, 30, 1)}
        ${RangeField("blurOpacity", "背景濃度", c.blurOpacity, 0.12, 0.9, 0.01)}
      </div>
      <div class="add-text-row">
        <input type="text" placeholder="追加する文字" data-new-text />
        <button class="ghost-btn" type="button" data-action="add-text">文字追加</button>
      </div>
      <div class="layer-actions">
        <button class="ghost-btn" type="button" data-action="toggle-text-direction">${selectedCustom && selectedCustom.vertical ? "横書きへ" : "縦書きへ"}</button>
        <button class="ghost-btn danger-btn" type="button" data-action="delete-text">追加文字を削除</button>
      </div>
      <div class="status-line" data-selected-status>選択中: ${escapeHtml(state.selectedLayerId || "未選択")}</div>
      <button class="ghost-btn reset-controls" type="button" data-action="reset-controls">配置をリセット</button>
    </section>
  `;
}

function RangeField(key, label, value, min, max, step) {
  return `
    <div class="field">
      <label for="${key}">${label} <span data-control-value="${key}">${formatControlValue(key, value)}</span></label>
      <input id="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-control="${key}" />
    </div>
  `;
}

function DesignPreview() {
  return `
    <div class="design-stage" style="${stageVars()}">
      <div class="design-preview design-${state.selectedPreset}" style="${designVars()}">
        ${PresetLayout()}
        ${CustomTextLayers()}
      </div>
    </div>
  `;
}

function ImagePreview() {
  if (!state.imageUrl) {
    return `<div class="image-placeholder">写真をアップロードするとここにプレビューが表示されます。</div>`;
  }
  return `<img src="${state.imageUrl}" alt="アップロード写真" />`;
}

function PresetLayout() {
  const id = state.selectedPreset;
  const img = Photo();
  const blur = BlurPhoto();
  const location = placeText();
  const camera = escapeHtml(cameraText());
  const lens = escapeHtml(lensText());
  const settings = escapeHtml(settingsLine());
  const maker = escapeHtml(makerText());
  const model = escapeHtml(shortCameraText());
  const spec = SpecLines();

  const layouts = {
    "soft-side-spec": `
      <div class="paper-canvas soft">
        <div class="side-spec left text-layer" data-text-layer>${spec}</div>
        <figure class="framed-photo">${img}</figure>
      </div>`,
    "black-cinema": `
      <div class="cinema-canvas">
        <figure class="cinema-photo">${img}</figure>
        <div class="corner-spec right text-layer" data-text-layer>${maker}<br>${model}<br>${settings}</div>
      </div>`,
    "blur-vertical": `
      <div class="blur-canvas">${blur}
        <figure class="vertical-photo">${img}</figure>
        <div class="rotate-spec text-layer" data-text-layer>${settings}</div>
      </div>`,
    "frost-frame": `
      <div class="frost-canvas">${blur}
        <figure class="wide-frame">${img}</figure>
        <div class="bottom-muted text-layer" data-text-layer>${camera}<br>${settings}</div>
      </div>`,
    "dark-border": `
      <div class="dark-canvas">${blur}
        <figure class="border-photo">${img}</figure>
        <div class="bottom-left text-layer" data-text-layer>${maker}<br>${model}</div>
        <div class="bottom-right text-layer" data-text-layer>${lens}</div>
      </div>`,
    "tokyo-editorial": `
      <div class="editorial-canvas">
        <aside class="editorial-copy text-layer" data-text-layer><h3>${location}</h3>${SpecLines("compact")}</aside>
        <figure class="editorial-photo">${img}</figure>
      </div>`,
    "city-overlay": `
      <div class="full-photo-canvas">${img}
        <div class="overlay-title text-layer" data-text-layer>${location}</div>
        <div class="overlay-spec text-layer" data-text-layer>${camera} | ${lens}<br>${settings}</div>
      </div>`,
    "gallery-print": `
      <div class="gallery-canvas">
        <figure class="gallery-photo">${img}</figure>
      </div>`,
    "polaroid-title": `
      <div class="paper-canvas texture">
        <figure class="polaroid">${img}<figcaption class="text-layer" data-text-layer>${location}</figcaption></figure>
        <div class="under-spec text-layer" data-text-layer>${camera} | ${lens}<br>${settings}</div>
      </div>`,
    "mono-caption": `
      <div class="mono-canvas">
        <figure class="mono-photo">${img}</figure>
        <div class="under-spec strong text-layer" data-text-layer>${camera} | ${lens}<br>${settings}</div>
      </div>`,
    "gear-split": `
      <div class="gear-canvas texture">
        <div class="gear-badge top text-layer" data-text-layer><span></span><strong>${model}</strong></div>
        <figure class="gear-photo">${img}</figure>
        <div class="gear-badge bottom text-layer" data-text-layer><span></span><strong>${lensShort()}</strong></div>
      </div>`,
    "paper-spec": `
      <div class="paper-canvas texture split">
        <aside class="paper-gear text-layer" data-text-layer><div class="icon-lens"></div><strong>${model}</strong><div class="icon-lens small"></div><strong>${lensShort()}</strong><p>${settings}</p></aside>
        <figure class="paper-photo">${img}</figure>
      </div>`,
    "travel-story": `
      <div class="story-canvas">${img}
        <div class="story-spec text-layer" data-text-layer>${camera} | ${lens}<br>${settings}</div>
        <div class="story-place text-layer" data-text-layer>${location}</div>
      </div>`,
    "hongkong-polaroid": `
      <div class="paper-canvas texture">
        <figure class="polaroid tall">${img}<figcaption class="text-layer" data-text-layer>${location}</figcaption></figure>
        <div class="under-spec text-layer" data-text-layer>${camera} | ${lens}<br>${settings}</div>
      </div>`,
    "night-matte": `
      <div class="night-canvas">
        <figure class="night-photo">${img}</figure>
        <div class="night-spec text-layer" data-text-layer>${camera}<br>${settings}</div>
      </div>`,
    "clean-shadow": `
      <div class="clean-canvas">
        <figure class="clean-photo">${img}</figure>
        <div class="under-spec strong text-layer" data-text-layer>${camera}<br>${settings}</div>
      </div>`,
    "glass-center": `
      <div class="glass-canvas">${blur}
        <figure class="glass-photo">${img}</figure>
        <div class="glass-spec text-layer" data-text-layer>${camera} | ${lens}<br>${settings}</div>
      </div>`,
  };

  return layouts[id] || layouts["soft-side-spec"];
}

function Photo() {
  return state.imageUrl ? `<img class="primary-photo" src="${state.imageUrl}" alt="アップロード写真" />` : ImagePreview();
}

function BlurPhoto() {
  if (!state.imageUrl) return "";
  return `<img class="blur-bg" src="${state.imageUrl}" alt="" aria-hidden="true" />`;
}

function CustomTextLayers() {
  return state.customTexts
    .map((item) => `<div class="custom-text-layer text-layer ${item.vertical ? "is-vertical" : ""}" data-text-layer data-layer-id="${item.id}">${escapeHtml(item.text)}</div>`)
    .join("");
}

function SpecLines(mode = "normal") {
  const maker = escapeHtml(makerText());
  const model = escapeHtml(shortCameraText());
  const lens = escapeHtml(lensShort());
  const d = state.data;
  const lines = mode === "compact"
    ? [maker, model, lens, d.focalLength, d.fNumber, d.shutterSpeed, d.iso]
    : [maker, model, lens, d.focalLength, d.fNumber, d.shutterSpeed, d.iso];
  return lines.filter(Boolean).map((line, index) => `<span class="${index < 2 ? "bold" : ""}">${escapeHtml(line)}</span>`).join("");
}

function designVars() {
  const c = state.controls;
  return [
    `--text-x:${c.textX}%`,
    `--text-y:${c.textY}%`,
    `--text-scale:${c.textScale}`,
    `--photo-scale:${c.photoScale}`,
    `--photo-x:${c.photoX}%`,
    `--photo-y:${c.photoY}%`,
    `--bg-scale:${c.bgScale}`,
    `--bg-x:${c.bgX}%`,
    `--bg-y:${c.bgY}%`,
    `--blur-amount:${c.blurAmount}px`,
    `--blur-opacity:${c.blurOpacity}`,
  ].join(";");
}

function stageVars() {
  return `--preview-ratio:${previewRatioValue()}`;
}

function previewRatioValue() {
  const selected = previewRatios[state.selectedRatio] || previewRatios.auto;
  if (selected.ratio) return selected.ratio;
  const image = state.imageElement;
  const width = image && (image.naturalWidth || image.width);
  const height = image && (image.naturalHeight || image.height);
  return width && height ? width / height : 4 / 3;
}

function formatControlValue(key, value) {
  if (key === "textX" || key === "textY") return `${value}%`;
  if (key === "photoX" || key === "photoY" || key === "bgX" || key === "bgY") return `${value}%`;
  if (key === "blurAmount") return `${value}px`;
  if (key === "blurOpacity") return `${Math.round(value * 100)}%`;
  if (key === "bgScale") return `${Math.round(value * 100)}%`;
  return `${Math.round(value * 100)}%`;
}

function bindEvents() {
  const input = app.querySelector("[data-file-input]");
  const dropzone = app.querySelector("[data-dropzone]");

  app.querySelectorAll("[data-action='pick-file']").forEach((button) => {
    button.addEventListener("click", () => input && input.click());
  });

  app.querySelectorAll("[data-action='reset']").forEach((button) => {
    button.addEventListener("click", resetApp);
  });

  app.querySelectorAll("[data-action='download']").forEach((button) => {
    button.addEventListener("click", downloadPng);
  });

  app.querySelectorAll("[data-action='demo']").forEach((button) => {
    button.addEventListener("click", loadDemoImage);
  });

  app.querySelectorAll("[data-action='reset-controls']").forEach((button) => {
    button.addEventListener("click", () => {
      state.controls = { textX: 0, textY: 0, textScale: 1, photoScale: 1, photoX: 0, photoY: 0, bgScale: 1.04, bgX: 0, bgY: 0, blurAmount: 12, blurOpacity: 0.38 };
      state.layerControls = {};
      state.selectedLayerId = "";
      App();
    });
  });

  app.querySelectorAll("[data-action='add-text']").forEach((button) => {
    button.addEventListener("click", () => {
      const inputEl = app.querySelector("[data-new-text]");
      const text = inputEl && inputEl.value.trim();
      if (!text) return;
      const id = `custom-${Date.now()}`;
      state.customTexts.push({ id, text });
      state.layerControls[id] = { textX: 0, textY: 0, textScale: 1 };
      state.selectedLayerId = id;
      App();
    });
  });

  app.querySelectorAll("[data-action='delete-text']").forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.selectedLayerId) return;
      const before = state.customTexts.length;
      state.customTexts = state.customTexts.filter((item) => item.id !== state.selectedLayerId);
      if (state.customTexts.length !== before) {
        delete state.layerControls[state.selectedLayerId];
        state.selectedLayerId = "";
        App();
      }
    });
  });

  app.querySelectorAll("[data-action='toggle-text-direction']").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.customTexts.find((text) => text.id === state.selectedLayerId);
      if (!item) return;
      item.vertical = !item.vertical;
      App();
    });
  });

  if (input) {
    input.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (file) handleFile(file);
    });
  }

  if (dropzone) {
    ["dragenter", "dragover"].forEach((name) =>
      dropzone.addEventListener(name, (event) => {
        event.preventDefault();
        dropzone.classList.add("is-dragging");
      }),
    );
    ["dragleave", "drop"].forEach((name) =>
      dropzone.addEventListener(name, (event) => {
        event.preventDefault();
        dropzone.classList.remove("is-dragging");
      }),
    );
    dropzone.addEventListener("drop", (event) => {
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) handleFile(file);
    });
  }

  app.querySelectorAll("[data-field]").forEach((field) => {
    field.addEventListener("input", (event) => {
      state.data[event.target.dataset.field] = event.target.value;
      refreshPreviewOnly();
    });
  });

  app.querySelectorAll("[data-control]").forEach((field) => {
    field.addEventListener("input", (event) => {
      const key = event.target.dataset.control;
      if (["textX", "textY", "textScale"].includes(key) && state.selectedLayerId) {
        const layer = selectedLayerControls();
        layer[key] = Number(event.target.value);
        state.layerControls[state.selectedLayerId] = layer;
      } else {
        state.controls[key] = Number(event.target.value);
      }
      updateControlReadout(key);
      applyDesignVars();
      applyLayerStyles();
    });
  });

  app.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedPreset = button.dataset.preset;
      App();
    });
  });

  const sizeSelect = app.querySelector("[data-size]");
  if (sizeSelect) {
    sizeSelect.addEventListener("change", (event) => {
      state.selectedSize = event.target.value;
      App();
    });
  }

  const ratioSelect = app.querySelector("[data-ratio]");
  if (ratioSelect) {
    ratioSelect.addEventListener("change", (event) => {
      state.selectedRatio = event.target.value;
      App();
    });
  }

  bindTouchEditor();
}

async function handleFile(file) {
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|heic|heif)$/i.test(file.name)) {
    alert("JPEG / PNG / HEIC画像を選択してください。");
    return;
  }

  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  state.imageFile = file;
  state.imageUrl = URL.createObjectURL(file);
  state.imageElement = await loadImage(state.imageUrl);
  const exif = await parseExif(file);
  state.exifFound = Boolean(exif && Object.values(exif).some(Boolean));
  state.data = normalizeExif(exif);
  App();
}

async function loadDemoImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 950;
  const ctx = canvas.getContext("2d");
  const sky = ctx.createLinearGradient(0, 0, 1400, 950);
  sky.addColorStop(0, "#8fb9cf");
  sky.addColorStop(0.48, "#ead0a2");
  sky.addColorStop(1, "#1b2732");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1400, 950);
  ctx.fillStyle = "rgba(248,223,148,0.76)";
  ctx.beginPath();
  ctx.arc(1110, 180, 120, 0, Math.PI * 2);
  ctx.fill();
  drawDemoHill(ctx, "#31414b", 680, 240);
  drawDemoHill(ctx, "#172129", 760, 360);
  drawDemoHill(ctx, "#c7834c", 830, 570);
  ctx.fillStyle = "rgba(16,16,16,0.35)";
  roundRect(ctx, 170, 280, 210, 390, 105, "rgba(16,16,16,0.35)");
  ctx.fillStyle = "#171717";
  ctx.beginPath();
  ctx.arc(275, 220, 62, 0, Math.PI * 2);
  ctx.fill();
  roundRect(ctx, 234, 270, 82, 260, 41, "#20242a");
  ctx.strokeStyle = "#20242a";
  ctx.lineWidth = 34;
  ctx.lineCap = "round";
  [["M", 230, 360, 130, 580], ["M", 320, 365, 430, 585], ["M", 245, 525, 210, 760], ["M", 304, 525, 365, 760]].forEach((p) => {
    ctx.beginPath();
    ctx.moveTo(p[1], p[2]);
    ctx.lineTo(p[3], p[4]);
    ctx.stroke();
  });
  const url = canvas.toDataURL("image/png");
  state.imageFile = null;
  state.imageUrl = url;
  state.imageElement = await loadImage(url);
  state.exifFound = true;
  state.data = {
    maker: "FUJIFILM",
    camera: "FUJIFILM X-M5",
    lens: "XF27mmF2.8 R WR",
    focalLength: "27mm",
    fNumber: "F2.8",
    shutterSpeed: "1/3800s",
    iso: "ISO125",
    date: "2026.06.06",
    exposureBias: "",
    whiteBalance: "Auto",
    location: "Ayers Rock",
    gps: "",
    comment: "Tokyo",
  };
  App();
}

function drawDemoHill(ctx, color, y1, y2) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, y1);
  ctx.bezierCurveTo(260, y1 - 160, 410, y1 - 110, 600, y1 - 220);
  ctx.bezierCurveTo(760, y1 - 310, 1000, y1 - 280, 1400, y2);
  ctx.lineTo(1400, 950);
  ctx.lineTo(0, 950);
  ctx.closePath();
  ctx.fill();
}

function refreshPreviewOnly() {
  const stage = app.querySelector(".design-stage");
  if (stage) stage.outerHTML = DesignPreview();
  const status = app.querySelector(".status-line");
  if (status) {
    status.innerHTML = `Camera: ${escapeHtml(state.data.camera || "未入力")}<br />Lens: ${escapeHtml(state.data.lens || "未入力")}<br />Settings: ${escapeHtml(settingsLine())}<br />Date: ${escapeHtml(state.data.date || "未入力")}`;
  }
  bindTouchEditor();
}

function applyDesignVars() {
  const preview = app.querySelector(".design-preview");
  if (preview) preview.setAttribute("style", designVars());
}

function updateControlReadout(key) {
  const readout = app.querySelector(`[data-control-value="${key}"]`);
  const value = ["textX", "textY", "textScale"].includes(key) && state.selectedLayerId
    ? selectedLayerControls()[key]
    : state.controls[key];
  if (readout) readout.textContent = formatControlValue(key, value);
}

function bindTouchEditor() {
  const stage = app.querySelector(".design-stage");
  if (!stage || stage.dataset.touchBound === "true") return;
  stage.dataset.touchBound = "true";
  prepareTextLayers();
  applyLayerStyles();
  const pointers = new Map();
  let dragStart = null;
  let pinchStart = null;
  let activeTarget = "";

  stage.addEventListener("pointerdown", (event) => {
    const textLayer = event.target.closest("[data-text-layer]");
    const figureLayer = event.target.closest("figure");
    const photoLayer = event.target.closest(".primary-photo") || (figureLayer && figureLayer.querySelector(".primary-photo") ? figureLayer : null);
    const bgLayer = event.target.closest(".blur-bg");
    if (!textLayer && !photoLayer && !bgLayer) return;
    event.preventDefault();
    activeTarget = textLayer ? "text" : bgLayer ? "background" : "photo";
    if (textLayer) selectLayer(textLayer.dataset.layerId);
    else selectPhotoLayer(activeTarget);
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const layer = activeTarget === "text" ? selectedLayerControls() : null;
    if (pointers.size === 1) {
      dragStart = {
        x: event.clientX,
        y: event.clientY,
        textX: layer ? layer.textX : 0,
        textY: layer ? layer.textY : 0,
        photoX: state.controls.photoX,
        photoY: state.controls.photoY,
        bgX: state.controls.bgX,
        bgY: state.controls.bgY,
      };
    } else if (pointers.size === 2) {
      const pts = [...pointers.values()];
      pinchStart = {
        distance: pointerDistance(pts[0], pts[1]),
        scale: layer ? layer.textScale : activeTarget === "background" ? state.controls.bgScale : state.controls.photoScale,
      };
    }
  });

  stage.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;
    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const rect = stage.getBoundingClientRect();
    const layer = activeTarget === "text" ? selectedLayerControls() : null;
    if (pointers.size >= 2 && pinchStart) {
      const pts = [...pointers.values()];
      const next = pinchStart.scale * (pointerDistance(pts[0], pts[1]) / Math.max(1, pinchStart.distance));
      if (activeTarget === "text") {
        layer.textScale = clamp(next, 0.35, 3);
        state.layerControls[state.selectedLayerId] = layer;
        syncControl("textScale");
      } else if (activeTarget === "background") {
        state.controls.bgScale = clamp(next, 1, 1.8);
        syncControl("bgScale");
      } else {
        state.controls.photoScale = clamp(next, 0.55, 1.75);
        syncControl("photoScale");
      }
    } else if (dragStart) {
      const dx = ((event.clientX - dragStart.x) / rect.width) * 100;
      const dy = ((event.clientY - dragStart.y) / rect.height) * 100;
      if (activeTarget === "text") {
        layer.textX = clamp(dragStart.textX + dx, -50, 50);
        layer.textY = clamp(dragStart.textY + dy, -50, 50);
        state.layerControls[state.selectedLayerId] = layer;
        syncControl("textX");
        syncControl("textY");
      } else if (activeTarget === "background") {
        state.controls.bgX = clamp(dragStart.bgX + dx, -50, 50);
        state.controls.bgY = clamp(dragStart.bgY + dy, -50, 50);
        syncControl("bgX");
        syncControl("bgY");
      } else {
        state.controls.photoX = clamp(dragStart.photoX + dx, -50, 50);
        state.controls.photoY = clamp(dragStart.photoY + dy, -50, 50);
        syncControl("photoX");
        syncControl("photoY");
      }
    }
    applyDesignVars();
    applyLayerStyles();
  });

  ["pointerup", "pointercancel", "pointerleave"].forEach((name) => {
    stage.addEventListener(name, (event) => {
      pointers.delete(event.pointerId);
      if (pointers.size === 0) {
        dragStart = null;
        pinchStart = null;
        activeTarget = "";
      }
    });
  });
}

function prepareTextLayers() {
  const layers = [...app.querySelectorAll("[data-text-layer]")];
  layers.forEach((layer, index) => {
    if (!layer.dataset.layerId) layer.dataset.layerId = `${state.selectedPreset}-${index}`;
  });
}

function selectLayer(id) {
  if (!id) return;
  state.selectedLayerId = id;
  if (!state.layerControls[id]) state.layerControls[id] = { textX: 0, textY: 0, textScale: 1 };
  app.querySelectorAll("[data-text-layer]").forEach((layer) => {
    layer.classList.toggle("is-selected", layer.dataset.layerId === id);
  });
  syncControl("textX");
  syncControl("textY");
  syncControl("textScale");
  updateSelectedStatus();
}

function selectPhotoLayer(target) {
  state.selectedLayerId = target === "background" ? "背景写真" : "写真";
  app.querySelectorAll("[data-text-layer]").forEach((layer) => layer.classList.remove("is-selected"));
  app.querySelectorAll("figure, .primary-photo, .blur-bg").forEach((layer) => {
    const isPrimaryFigure = layer.matches("figure") && layer.querySelector(".primary-photo");
    const isPrimaryImage = layer.classList.contains("primary-photo");
    const isBackground = layer.classList.contains("blur-bg");
    layer.classList.toggle("is-photo-selected", target === "background" ? isBackground : isPrimaryFigure || isPrimaryImage);
  });
  updateSelectedStatus();
}

function updateSelectedStatus() {
  const status = app.querySelector("[data-selected-status]");
  if (status) status.textContent = `選択中: ${state.selectedLayerId || "未選択"}`;
  const selectedCustom = state.customTexts.find((item) => item.id === state.selectedLayerId);
  const toggle = app.querySelector("[data-action='toggle-text-direction']");
  if (toggle) toggle.textContent = selectedCustom && selectedCustom.vertical ? "横書きへ" : "縦書きへ";
}

function selectedLayerControls() {
  if (!state.selectedLayerId) return { textX: state.controls.textX, textY: state.controls.textY, textScale: state.controls.textScale };
  if (!state.layerControls[state.selectedLayerId]) state.layerControls[state.selectedLayerId] = { textX: 0, textY: 0, textScale: 1 };
  return state.layerControls[state.selectedLayerId];
}

function applyLayerStyles() {
  prepareTextLayers();
  app.querySelectorAll("[data-text-layer]").forEach((layer) => {
    const c = state.layerControls[layer.dataset.layerId] || { textX: 0, textY: 0, textScale: 1 };
    layer.style.setProperty("--layer-x", `${c.textX}%`);
    layer.style.setProperty("--layer-y", `${c.textY}%`);
    layer.style.setProperty("--layer-scale", c.textScale);
    layer.classList.toggle("is-selected", layer.dataset.layerId === state.selectedLayerId);
  });
}

function pointerDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function syncControl(key) {
  const input = app.querySelector(`[data-control="${key}"]`);
  const value = ["textX", "textY", "textScale"].includes(key) && state.selectedLayerId
    ? selectedLayerControls()[key]
    : state.controls[key];
  if (input) input.value = value;
  updateControlReadout(key);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resetApp() {
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  state.imageFile = null;
  state.imageUrl = "";
  state.imageElement = null;
  state.exifFound = false;
  state.data = blankExif();
  App();
}

async function parseExif(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (isJpeg(bytes)) return parseJpegExif(bytes);
  if (isPng(bytes)) return parsePngExif(bytes);
  return {};
}

function isJpeg(bytes) {
  return bytes[0] === 0xff && bytes[1] === 0xd8;
}

function isPng(bytes) {
  return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
}

function parseJpegExif(bytes) {
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
    if (marker === 0xe1 && ascii(bytes, offset + 4, 6) === "Exif\0\0") {
      return parseTiff(bytes, offset + 10, offset + 10 + length - 8);
    }
    offset += 2 + length;
  }
  return {};
}

function parsePngExif(bytes) {
  let offset = 8;
  while (offset + 12 < bytes.length) {
    const length = readUint32(bytes, offset, false);
    const type = ascii(bytes, offset + 4, 4);
    if (type === "eXIf") return parseTiff(bytes, offset + 8, offset + 8 + length);
    offset += 12 + length;
  }
  return {};
}

function parseTiff(bytes, start, end) {
  const little = ascii(bytes, start, 2) === "II";
  const firstIfd = readUint32(bytes, start + 4, little);
  const tags = {};
  const ifd0 = readIfd(bytes, start, start + firstIfd, little, end);
  Object.assign(tags, ifd0.values);

  if (ifd0.values.ExifIFDPointer) {
    Object.assign(tags, readIfd(bytes, start, start + ifd0.values.ExifIFDPointer, little, end).values);
  }
  if (ifd0.values.GPSInfoIFDPointer) {
    const gpsValues = readIfd(bytes, start, start + ifd0.values.GPSInfoIFDPointer, little, end).values;
    tags.gps = gpsToText(gpsValues);
    tags.location = tags.gps;
  }
  return tags;
}

function readIfd(bytes, tiffStart, offset, little, end) {
  const values = {};
  if (offset < tiffStart || offset + 2 > end) return { values };
  const count = readUint16(bytes, offset, little);
  for (let i = 0; i < count; i += 1) {
    const entry = offset + 2 + i * 12;
    if (entry + 12 > end) break;
    const tag = readUint16(bytes, entry, little);
    const type = readUint16(bytes, entry + 2, little);
    const length = readUint32(bytes, entry + 4, little);
    const valueOffset = valueByteLength(type, length) <= 4 ? entry + 8 : tiffStart + readUint32(bytes, entry + 8, little);
    const value = readExifValue(bytes, tiffStart, valueOffset, type, length, little, end);
    const name = tagName(tag);
    if (name) values[name] = value;
  }
  return { values };
}

function readExifValue(bytes, tiffStart, offset, type, length, little, end) {
  if (offset < tiffStart || offset >= end) return "";
  if (type === 2) return ascii(bytes, offset, Math.min(length, end - offset)).replace(/\0+$/, "").trim();
  if (type === 3) {
    if (length === 1) return readUint16(bytes, offset, little);
    return Array.from({ length }, (_, i) => readUint16(bytes, offset + i * 2, little));
  }
  if (type === 4) {
    if (length === 1) return readUint32(bytes, offset, little);
    return Array.from({ length }, (_, i) => readUint32(bytes, offset + i * 4, little));
  }
  if (type === 5) {
    const vals = Array.from({ length }, (_, i) => {
      const n = readUint32(bytes, offset + i * 8, little);
      const d = readUint32(bytes, offset + i * 8 + 4, little);
      return d ? n / d : 0;
    });
    return length === 1 ? vals[0] : vals;
  }
  if (type === 10) {
    const vals = Array.from({ length }, (_, i) => {
      const n = readInt32(bytes, offset + i * 8, little);
      const d = readInt32(bytes, offset + i * 8 + 4, little);
      return d ? n / d : 0;
    });
    return length === 1 ? vals[0] : vals;
  }
  return "";
}

function valueByteLength(type, length) {
  const sizes = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 10: 8 };
  return (sizes[type] || 1) * length;
}

function tagName(tag) {
  return {
    0x010f: "maker",
    0x0110: "camera",
    0x0132: "date",
    0x8769: "ExifIFDPointer",
    0x8825: "GPSInfoIFDPointer",
    0x829a: "exposureTimeRaw",
    0x829d: "fNumberRaw",
    0x8827: "isoRaw",
    0x9003: "date",
    0x9204: "exposureBiasRaw",
    0x920a: "focalLengthRaw",
    0xa403: "whiteBalanceRaw",
    0xa434: "lens",
    0x0001: "GPSLatitudeRef",
    0x0002: "GPSLatitude",
    0x0003: "GPSLongitudeRef",
    0x0004: "GPSLongitude",
  }[tag];
}

function normalizeExif(exif = {}) {
  const data = blankExif();
  data.maker = clean(exif.maker);
  data.camera = [clean(exif.maker), clean(exif.camera)].filter(Boolean).join(" ").replace(/^(.+?) \1\b/, "$1");
  data.lens = clean(exif.lens);
  data.focalLength = formatFocal(exif.focalLengthRaw);
  data.fNumber = formatFNumber(exif.fNumberRaw);
  data.shutterSpeed = formatShutter(exif.exposureTimeRaw);
  data.iso = exif.isoRaw ? `ISO ${Array.isArray(exif.isoRaw) ? exif.isoRaw[0] : exif.isoRaw}` : "";
  data.date = formatDate(clean(exif.date));
  data.exposureBias = formatBias(exif.exposureBiasRaw);
  data.whiteBalance = exif.whiteBalanceRaw === 0 ? "Auto" : exif.whiteBalanceRaw === 1 ? "Manual" : "";
  data.location = clean(exif.location);
  data.gps = clean(exif.gps);
  return data;
}

function gpsToText(gps) {
  if (!gps.GPSLatitude || !gps.GPSLongitude) return "";
  const lat = gpsCoord(gps.GPSLatitude, gps.GPSLatitudeRef);
  const lon = gpsCoord(gps.GPSLongitude, gps.GPSLongitudeRef);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "";
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

function gpsCoord(value, ref) {
  const arr = Array.isArray(value) ? value : [value];
  const deg = (arr[0] || 0) + (arr[1] || 0) / 60 + (arr[2] || 0) / 3600;
  return ref === "S" || ref === "W" ? -deg : deg;
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function formatFocal(value) {
  return value ? `${round(value)}mm` : "";
}

function formatFNumber(value) {
  return value ? `f${round(value, 1)}` : "";
}

function formatShutter(value) {
  if (!value) return "";
  if (value >= 1) return `${round(value, 1)}s`;
  return `1/${Math.round(1 / value)}s`;
}

function formatBias(value) {
  if (value === "" || value === undefined) return "";
  const sign = value > 0 ? "+" : "";
  return `${sign}${round(value, 1)} EV`;
}

function formatDate(value) {
  if (!value) return "";
  const m = value.match(/^(\d{4}):(\d{2}):(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
  if (!m) return value;
  return `${m[1]}.${m[2]}.${m[3]}${m[4] ? ` ${m[4]}:${m[5]}` : ""}`;
}

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return `${Math.round(value * factor) / factor}`;
}

function settingsLine() {
  const d = state.data;
  return [d.focalLength, d.fNumber, d.shutterSpeed, d.iso].filter(Boolean).join("  |  ") || "70mm  |  f2.8  |  1/250s  |  ISO 400";
}

function cameraText() {
  return state.data.camera || "Camera Model";
}

function shortCameraText() {
  const parts = cameraText().split(/\s+/).filter(Boolean);
  return parts.length > 2 ? parts.slice(-2).join(" ") : cameraText();
}

function makerText() {
  return state.data.maker || cameraText().split(/\s+/)[0] || "CAMERA";
}

function lensText() {
  return state.data.lens || "Lens information";
}

function lensShort() {
  const lens = lensText();
  return lens.length > 24 ? `${lens.slice(0, 24)}...` : lens;
}

function placeText() {
  return state.data.location || state.data.comment || "Tokyo";
}

function presetName() {
  return presets.find((preset) => preset.id === state.selectedPreset)?.name || "";
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function downloadPng() {
  if (!state.imageElement) {
    alert("先に写真をアップロードしてください。");
    return;
  }
  setExportStatus("PNGを書き出しています...");
  try {
    const canvas = await renderCanvas();
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], `photospec-${state.selectedPreset}.png`, { type: "image/png" });
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try {
        await navigator.share({
          files: [file],
          title: "PhotoSpec Studio",
          text: "PhotoSpec Studioで作成した画像です。",
        });
        setExportStatus("共有シートを開きました。iPhoneでは「画像を保存」を選ぶと写真に保存できます。");
        return;
      } catch (shareError) {
        if (shareError && shareError.name === "AbortError") {
          setExportStatus("共有をキャンセルしました。");
          return;
        }
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExportStatus("PNGを書き出しました。");
  } catch (error) {
    console.error(error);
    setExportStatus(`書き出しに失敗しました: ${error && error.message ? error.message : "別の画像でお試しください。"}`);
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNGの生成に失敗しました。"));
    }, "image/png");
  });
}

function setExportStatus(message) {
  const el = app.querySelector("[data-export-status]");
  if (el) el.textContent = message;
}

async function renderCanvas() {
  const image = state.imageElement;
  const size = exportSizes[state.selectedSize];
  const dimensions = exportDimensions(image, size);
  const width = dimensions.width;
  const height = dimensions.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  drawPresetCanvas(ctx, image, width, height);
  return canvas;
}

function exportDimensions(image, size) {
  if (size.width && size.height) return { width: size.width, height: size.height };
  const sourceWidth = image.naturalWidth || image.width || 1200;
  const sourceHeight = image.naturalHeight || image.height || 900;
  const ratio = previewRatioValue();
  const longEdge = Math.max(sourceWidth, sourceHeight);
  if (ratio >= 1) {
    return {
      width: Math.round(longEdge),
      height: Math.round(longEdge / ratio),
    };
  }
  return {
    width: Math.round(longEdge * ratio),
    height: Math.round(longEdge),
  };
}

function drawPresetCanvas(ctx, image, width, height) {
  const id = state.selectedPreset;
  const pad = Math.max(34, Math.round(Math.min(width, height) * 0.05));
  state.canvasTextIndex = 0;
  ctx.fillStyle = "#f7f7f4";
  ctx.fillRect(0, 0, width, height);

  if (id === "soft-side-spec") {
    ctx.fillStyle = "#fbfbfa";
    ctx.fillRect(0, 0, width, height);
    drawSpecColumn(ctx, pad, height * 0.34, width * 0.18, "#555");
    drawPhotoCard(ctx, image, width * 0.23, pad, width * 0.72, height - pad * 2, "contain", true, 1);
  } else if (id === "black-cinema") {
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, width, height);
    drawScaledImageContain(ctx, image, width * 0.08, 0, width * 0.84, height);
    drawRightSpec(ctx, width - pad, height - pad * 2.4, "#fff");
  } else if (id === "blur-vertical") {
    drawBlurLikeBg(ctx, image, width, height);
    drawPhotoCard(ctx, image, width * 0.36, pad * 0.7, width * 0.28, height - pad * 1.4, "cover", false, 1);
    drawRotatedSpec(ctx, width * 0.31, height * 0.55, "#fff");
  } else if (id === "frost-frame") {
    drawBlurLikeBg(ctx, image, width, height, 0.25);
    drawPhotoCard(ctx, image, width * 0.18, height * 0.12, width * 0.68, height * 0.68, "cover", true, 0.55);
    drawCenteredCaption(ctx, width / 2, height * 0.86, "#666");
  } else if (id === "dark-border") {
    drawBlurLikeBg(ctx, image, width, height, 0.18);
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, 0, width, height);
    drawPhotoCard(ctx, image, width * 0.12, pad, width * 0.76, height - pad * 1.4, "cover", true, 1);
    drawSmallText(ctx, makerText(), pad, height - pad * 1.6, "#fff", 24, 800);
    drawSmallText(ctx, lensShort(), width - pad * 6, height - pad * 0.8, "#fff", 22, 600);
  } else if (id === "tokyo-editorial") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    drawSmallText(ctx, placeText(), pad * 1.4, height * 0.43, "#111", 48, 800, "Georgia");
    drawSpecColumn(ctx, pad * 1.4, height * 0.54, width * 0.18, "#111", 16);
    drawPhotoCard(ctx, image, width * 0.28, pad, width * 0.66, height - pad * 2, "cover", false, 1);
  } else if (id === "city-overlay") {
    drawMainImageCover(ctx, image, 0, 0, width, height);
    drawSmallText(ctx, placeText(), width * 0.43, height * 0.72, "#fff", 52, 800, "Georgia");
    drawCenteredCaption(ctx, width * 0.62, height * 0.82, "#fff");
  } else if (id === "gallery-print") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    drawPhotoCard(ctx, image, width * 0.16, height * 0.15, width * 0.68, height * 0.62, "cover", true, 1);
  } else if (id === "polaroid-title" || id === "hongkong-polaroid") {
    drawPaperBg(ctx, width, height);
    const tall = id === "hongkong-polaroid";
    const pw = tall ? width * 0.58 : width * 0.62;
    const ph = tall ? height * 0.78 : height * 0.72;
    const x = (width - pw) / 2;
    const y = pad * 0.8;
    drawPolaroid(ctx, image, x, y, pw, ph, placeText());
    drawCenteredCaption(ctx, width / 2, y + ph + pad * 0.8, "#111");
  } else if (id === "mono-caption") {
    ctx.fillStyle = "#eee";
    ctx.fillRect(0, 0, width, height);
    ctx.filter = "grayscale(1)";
    drawPhotoCard(ctx, image, width * 0.15, pad, width * 0.7, height * 0.76, "cover", false, 1);
    ctx.filter = "none";
    drawCenteredCaption(ctx, width / 2, height - pad * 0.8, "#111");
  } else if (id === "gear-split") {
    drawPaperBg(ctx, width, height);
    drawSmallText(ctx, shortCameraText(), pad, height * 0.82, "#111", 18, 800);
    drawSmallText(ctx, lensShort(), width - pad * 4.7, height * 0.82, "#111", 18, 800);
    drawPhotoCard(ctx, image, width * 0.18, height * 0.12, width * 0.64, height * 0.68, "cover", false, 1);
  } else if (id === "paper-spec") {
    drawPaperBg(ctx, width, height);
    drawSpecColumn(ctx, pad, height * 0.17, width * 0.2, "#111", 18);
    drawPhotoCard(ctx, image, width * 0.27, pad, width * 0.66, height - pad * 2, "cover", true, 1);
  } else if (id === "travel-story") {
    drawMainImageCover(ctx, image, 0, 0, width, height);
    drawSmallText(ctx, cameraText(), pad, height * 0.82, "#fff", 24, 800);
    drawSmallText(ctx, settingsLine(), pad, height * 0.87, "#fff", 18, 500);
    drawSmallText(ctx, placeText(), width * 0.38, height - pad, "#fff", 42, 800, "Georgia");
  } else if (id === "night-matte") {
    ctx.fillStyle = "#191919";
    ctx.fillRect(0, 0, width, height);
    drawPhotoCard(ctx, image, width * 0.14, height * 0.13, width * 0.72, height * 0.68, "cover", false, 1);
    drawCenteredCaption(ctx, width / 2, height * 0.87, "#ddd");
  } else if (id === "clean-shadow") {
    ctx.fillStyle = "#efefed";
    ctx.fillRect(0, 0, width, height);
    drawPhotoCard(ctx, image, width * 0.18, pad, width * 0.64, height * 0.72, "cover", true, 1);
    drawCenteredCaption(ctx, width / 2, height * 0.86, "#111");
  } else if (id === "glass-center") {
    drawBlurLikeBg(ctx, image, width, height, 0.35);
    drawPhotoCard(ctx, image, width * 0.18, height * 0.13, width * 0.64, height * 0.62, "cover", true, 1);
    drawCenteredCaption(ctx, width / 2, height * 0.82, "#fff");
  }
  drawCustomTextsCanvas(ctx, width, height);
  delete state.canvasTextIndex;
}

function drawImageContain(ctx, image, x, y, width, height) {
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  const scale = Math.min(width / iw, height / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (width - dw) / 2;
  const dy = y + (height - dh) / 2;
  ctx.drawImage(image, dx, dy, dw, dh);
}

function drawImageCover(ctx, image, x, y, width, height) {
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  const scale = Math.max(width / iw, height / ih);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function drawMainImageCover(ctx, image, x, y, width, height) {
  const rect = scaledRect(x, y, width, height, state.controls.photoScale);
  drawImageCover(ctx, image, rect.x + ctx.canvas.width * (state.controls.photoX / 100), rect.y + ctx.canvas.height * (state.controls.photoY / 100), rect.width, rect.height);
}

function drawPhotoCard(ctx, image, x, y, width, height, fit = "cover", border = false, alpha = 1) {
  const rect = scaledRect(x, y, width, height, state.controls.photoScale);
  x = rect.x + ctx.canvas.width * (state.controls.photoX / 100);
  y = rect.y + ctx.canvas.height * (state.controls.photoY / 100);
  width = rect.width;
  height = rect.height;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = border ? 24 : 0;
  ctx.shadowOffsetY = border ? 10 : 0;
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, width, height);
  ctx.shadowColor = "transparent";
  const inset = border ? Math.max(10, Math.min(width, height) * 0.018) : 0;
  if (fit === "contain") drawImageContain(ctx, image, x + inset, y + inset, width - inset * 2, height - inset * 2);
  else drawImageCover(ctx, image, x + inset, y + inset, width - inset * 2, height - inset * 2);
  if (border) {
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = Math.max(4, width * 0.006);
    ctx.strokeRect(x + inset / 2, y + inset / 2, width - inset, height - inset);
  }
  ctx.restore();
}

function drawScaledImageContain(ctx, image, x, y, width, height) {
  const rect = scaledRect(x, y, width, height, state.controls.photoScale);
  drawImageContain(ctx, image, rect.x + ctx.canvas.width * (state.controls.photoX / 100), rect.y + ctx.canvas.height * (state.controls.photoY / 100), rect.width, rect.height);
}

function scaledRect(x, y, width, height, scale) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const nextWidth = width * scale;
  const nextHeight = height * scale;
  return {
    x: cx - nextWidth / 2,
    y: cy - nextHeight / 2,
    width: nextWidth,
    height: nextHeight,
  };
}

function drawBlurLikeBg(ctx, image, width, height, wash = 0.45) {
  ctx.save();
  ctx.filter = `blur(${state.controls.blurAmount}px)`;
  const grow = 60 * state.controls.bgScale;
  const rect = scaledRect(-grow / 2, -grow / 2, width + grow, height + grow, state.controls.bgScale);
  drawImageCover(ctx, image, rect.x + width * (state.controls.bgX / 100), rect.y + height * (state.controls.bgY / 100), rect.width, rect.height);
  ctx.filter = "none";
  ctx.fillStyle = `rgba(245,247,246,${Math.max(0.05, state.controls.blurOpacity * wash * 2)})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawPaperBg(ctx, width, height) {
  ctx.fillStyle = "#f4f2ee";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(0,0,0,0.035)";
  for (let i = 0; i < 18; i += 1) {
    const y = (height / 18) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + Math.sin(i) * 18);
    ctx.stroke();
  }
}

function drawPolaroid(ctx, image, x, y, width, height, title) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.24)";
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, width, height);
  ctx.shadowColor = "transparent";
  const inset = width * 0.065;
  const bottom = height * 0.19;
  drawImageCover(ctx, image, x + inset, y + inset, width - inset * 2, height - inset - bottom);
  ctx.textAlign = "center";
  drawSmallText(ctx, title, x + width / 2, y + height - bottom * 0.35, "#111", Math.max(32, width * 0.08), 800, "Georgia", "center");
  ctx.restore();
}

function drawSpecColumn(ctx, x, y, maxWidth, color = "#111", size = 18) {
  const lines = [makerText(), shortCameraText(), lensShort(), state.data.focalLength, state.data.fNumber, state.data.shutterSpeed, state.data.iso].filter(Boolean);
  const lineHeight = scaledTextSize(ctx, size) * 1.55;
  lines.forEach((line, index) => {
    drawSmallText(ctx, line, x, y + index * lineHeight, color, size, index < 2 ? 800 : 500);
  });
}

function drawRightSpec(ctx, x, y, color) {
  ctx.textAlign = "right";
  const lineHeight = scaledTextSize(ctx, 18) * 1.55;
  [makerText(), shortCameraText(), settingsLine()].forEach((line, index) => {
    drawSmallText(ctx, line, x, y + index * lineHeight, color, index === 0 ? 19 : 17, index === 0 ? 800 : 500, "Helvetica", "right");
  });
  ctx.textAlign = "left";
}

function drawRotatedSpec(ctx, x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  drawSmallText(ctx, `${cameraText()}  |  ${settingsLine()}`, 0, 0, color, 18, 500);
  ctx.restore();
}

function drawCenteredCaption(ctx, x, y, color) {
  drawSmallText(ctx, cameraText(), x, y, color, 22, 800, "Helvetica", "center");
  drawSmallText(ctx, `${lensText()}  ${settingsLine()}`, x, y + scaledTextSize(ctx, 16) * 1.75, color, 16, 500, "Helvetica", "center");
}

function drawSmallText(ctx, text, x, y, color, size, weight = 500, family = "Helvetica", align = "left") {
  ctx.save();
  const layerId = `${state.selectedPreset}-${state.canvasTextIndex || 0}`;
  state.canvasTextIndex = (state.canvasTextIndex || 0) + 1;
  const layer = state.layerControls[layerId] || { textX: state.controls.textX, textY: state.controls.textY, textScale: state.controls.textScale };
  ctx.fillStyle = color;
  ctx.font = `${weight} ${scaledTextSize(ctx, size) * layer.textScale}px ${family}, Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(String(text || "-"), x + ctx.canvas.width * (layer.textX / 100), y + ctx.canvas.height * (layer.textY / 100));
  ctx.restore();
}

function scaledTextSize(ctx, size) {
  return size * canvasTextScale(ctx, size);
}

function canvasTextScale(ctx, size) {
  if (size >= 90) return 1;
  const shortEdge = Math.min(ctx.canvas.width, ctx.canvas.height);
  return clamp(shortEdge / 900, 1, 5);
}

function drawCustomTextsCanvas(ctx, width, height) {
  state.customTexts.forEach((item) => {
    const layer = state.layerControls[item.id] || { textX: 0, textY: 0, textScale: 1 };
    const fontSize = Math.max(24, width * 0.035) * layer.textScale;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = Math.max(14, fontSize * 0.28);
    ctx.font = `700 ${fontSize}px Helvetica, Arial, sans-serif`;
    ctx.textAlign = "center";
    const x = width * (0.5 + layer.textX / 100);
    const y = height * (0.5 + layer.textY / 100);
    if (item.vertical) {
      const chars = [...item.text];
      const lineHeight = fontSize * 1.12;
      chars.forEach((char, index) => ctx.fillText(char, x, y + index * lineHeight));
    } else {
      ctx.fillText(item.text, x, y);
    }
    ctx.restore();
  });
}

function drawMinimalCanvas(ctx, width, height) {
  const pad = Math.max(30, width * 0.03);
  const barH = Math.max(150, height * 0.17);
  ctx.fillStyle = "rgba(0,0,0,0.84)";
  ctx.fillRect(0, height - barH, width, barH);
  drawTextBlock(ctx, pad, height - barH + pad, width - pad * 2, "#fff", "#d7d7d7", "#d6b46a");
}

function drawCleanCanvas(ctx, width, height) {
  const pad = Math.max(34, width * 0.035);
  const cardH = Math.max(150, height * 0.16);
  roundRect(ctx, pad, height - cardH - pad, width - pad * 2, cardH, 16, "rgba(255,255,255,0.94)");
  drawTextBlock(ctx, pad * 1.55, height - cardH - pad + 30, width - pad * 3, "#111", "#4d4d4d", "#111");
}

function drawProCanvas(ctx, width, height) {
  const cardW = Math.min(520, width * 0.48);
  const cardH = Math.max(250, height * 0.27);
  const x = width - cardW - 44;
  const y = height - cardH - 44;
  roundRect(ctx, x, y, cardW, cardH, 16, "rgba(10,10,10,0.74)");
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.strokeRect(x, y, cardW, cardH);
  drawTextBlock(ctx, x + 30, y + 30, cardW - 60, "#fff", "#d7d7d7", "#d6b46a");
}

function drawStoryCanvas(ctx, width, height) {
  const pad = Math.max(38, width * 0.04);
  const y = height - Math.max(250, height * 0.24);
  drawTextBlock(ctx, pad, y, width - pad * 2, "#fff", "#eee", "#fff", true);
}

function drawMagazineCanvas(ctx, x, y, width, height) {
  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#96743d";
  ctx.font = `${Math.max(18, width * 0.035)}px Helvetica, Arial`;
  ctx.fillText("PHOTO SPECIFICATION", x + 44, y + 70);
  wrapText(ctx, cameraText(), x + 44, y + 140, width - 88, Math.max(42, width * 0.11), Math.max(48, width * 0.12), "#111", 760);
  wrapText(ctx, lensText(), x + 44, y + height * 0.48, width - 88, Math.max(24, width * 0.05), 34, "#111", 500);
  drawLabelValue(ctx, "SETTINGS", settingsLine(), x + 44, y + height * 0.68, width - 88);
  drawLabelValue(ctx, "DATE / LOCATION", [state.data.date, state.data.location].filter(Boolean).join(" / ") || "-", x + 44, y + height * 0.82, width - 88);
}

function drawTextBlock(ctx, x, y, maxWidth, primary, secondary, accent, shadow = false) {
  if (shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 3;
  }
  wrapText(ctx, cameraText(), x, y, maxWidth, Math.max(28, maxWidth * 0.045), Math.max(35, maxWidth * 0.055), primary, 700);
  wrapText(ctx, lensText(), x, y + Math.max(56, maxWidth * 0.075), maxWidth, Math.max(18, maxWidth * 0.026), 28, secondary, 400);
  wrapText(ctx, settingsLine(), x, y + Math.max(96, maxWidth * 0.12), maxWidth, Math.max(19, maxWidth * 0.028), 30, accent, 500);
  ctx.shadowBlur = 0;
}

function drawLabelValue(ctx, label, value, x, y, maxWidth) {
  ctx.font = "18px Helvetica, Arial";
  ctx.fillStyle = "#777";
  ctx.fillText(label, x, y);
  wrapText(ctx, value, x, y + 34, maxWidth, 26, 34, "#111", 500);
}

function wrapText(ctx, text, x, y, maxWidth, size, lineHeight, color, weight = 400) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Helvetica, Arial`;
  const words = String(text || "-").split(/\s+/);
  let line = "";
  for (let i = 0; i < words.length; i += 1) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = words[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function roundRect(ctx, x, y, width, height, radius, fill) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function readUint16(bytes, offset, little) {
  return little ? bytes[offset] + (bytes[offset + 1] << 8) : (bytes[offset] << 8) + bytes[offset + 1];
}

function readUint32(bytes, offset, little) {
  return little
    ? bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16) + bytes[offset + 3] * 2 ** 24
    : bytes[offset] * 2 ** 24 + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];
}

function readInt32(bytes, offset, little) {
  const value = readUint32(bytes, offset, little);
  return value > 0x7fffffff ? value - 0x100000000 : value;
}

function ascii(bytes, offset, length) {
  return Array.from(bytes.slice(offset, offset + length), (byte) => String.fromCharCode(byte)).join("");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

App();
