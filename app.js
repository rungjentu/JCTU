const layers = [
  { id: "photo", name: "照片層", className: "clip-photo" },
  { id: "video", name: "影片層", className: "clip-video" },
  { id: "subtitle", name: "字幕層", className: "clip-subtitle" },
  { id: "narration", name: "旁白層", className: "clip-narration" },
  { id: "music", name: "背景音樂層", className: "clip-music" },
];

const state = {
  clips: [],
  selectedId: "",
  clipboard: null,
  cacheDirectoryHandle: null,
  playhead: 0,
  pixelsPerSecond: 52,
  videoUrl: "",
  voices: [],
  isPlaying: false,
  recorder: null,
  recordStartedAt: 0,
  recordChunks: [],
};

const els = {
  addPhotoBtn: document.querySelector("#addPhotoBtn"),
  chooseCacheFolderBtn: document.querySelector("#chooseCacheFolderBtn"),
  saveProjectBtn: document.querySelector("#saveProjectBtn"),
  openProjectBtn: document.querySelector("#openProjectBtn"),
  addLayoutPhotoBtn: document.querySelector("#addLayoutPhotoBtn"),
  quickCutBtn: document.querySelector("#quickCutBtn"),
  addVideoBtn: document.querySelector("#addVideoBtn"),
  addSubtitleBtn: document.querySelector("#addSubtitleBtn"),
  addNarrationBtn: document.querySelector("#addNarrationBtn"),
  addMusicBtn: document.querySelector("#addMusicBtn"),
  photoInput: document.querySelector("#photoInput"),
  layoutPhotoInput: document.querySelector("#layoutPhotoInput"),
  quickCutInput: document.querySelector("#quickCutInput"),
  videoInput: document.querySelector("#videoInput"),
  musicInput: document.querySelector("#musicInput"),
  projectInput: document.querySelector("#projectInput"),
  clearBtn: document.querySelector("#clearBtn"),
  canvas: document.querySelector("#previewCanvas"),
  aspectSelect: document.querySelector("#aspectSelect"),
  defaultDurationInput: document.querySelector("#defaultDurationInput"),
  photoLayoutSelect: document.querySelector("#photoLayoutSelect"),
  quickCutDuration: document.querySelector("#quickCutDuration"),
  voiceSelect: document.querySelector("#voiceSelect"),
  musicMixMode: document.querySelector("#musicMixMode"),
  captureAudioToggle: document.querySelector("#captureAudioToggle"),
  previewBtn: document.querySelector("#previewBtn"),
  auditionAudioBtn: document.querySelector("#auditionAudioBtn"),
  stopBtn: document.querySelector("#stopBtn"),
  backBtn: document.querySelector("#backBtn"),
  forwardBtn: document.querySelector("#forwardBtn"),
  timeReadout: document.querySelector("#timeReadout"),
  durationReadout: document.querySelector("#durationReadout"),
  timelineWrap: document.querySelector("#timelineWrap"),
  timelineRows: document.querySelector("#timelineRows"),
  ruler: document.querySelector("#ruler"),
  playhead: document.querySelector("#playhead"),
  zoomInBtn: document.querySelector("#zoomInBtn"),
  zoomOutBtn: document.querySelector("#zoomOutBtn"),
  deleteSelectedBtn: document.querySelector("#deleteSelectedBtn"),
  emptyInspector: document.querySelector("#emptyInspector"),
  clipForm: document.querySelector("#clipForm"),
  clipLayer: document.querySelector("#clipLayer"),
  clipName: document.querySelector("#clipName"),
  clipStart: document.querySelector("#clipStart"),
  clipDuration: document.querySelector("#clipDuration"),
  textField: document.querySelector("#textField"),
  clipText: document.querySelector("#clipText"),
  languageField: document.querySelector("#languageField"),
  clipLanguage: document.querySelector("#clipLanguage"),
  duplicateBtn: document.querySelector("#duplicateBtn"),
  deleteBtn: document.querySelector("#deleteBtn"),
  recordBtn: document.querySelector("#recordBtn"),
  stopRecordBtn: document.querySelector("#stopRecordBtn"),
  narrationMode: document.querySelector("#narrationMode"),
  recordVoiceField: document.querySelector("#recordVoiceField"),
  recordVoiceSelect: document.querySelector("#recordVoiceSelect"),
  recordPreview: document.querySelector("#recordPreview"),
  renderBtn: document.querySelector("#renderBtn"),
  playBtn: document.querySelector("#playBtn"),
  downloadLink: document.querySelector("#downloadLink"),
  progress: document.querySelector("#renderProgress"),
  statusText: document.querySelector("#statusText"),
  resultVideo: document.querySelector("#resultVideo"),
  mediaBin: document.querySelector("#mediaBin"),
};

const ctx = els.canvas.getContext("2d");

els.addPhotoBtn.addEventListener("click", () => els.photoInput.click());
els.chooseCacheFolderBtn.addEventListener("click", chooseCacheFolder);
els.saveProjectBtn.addEventListener("click", saveProject);
els.openProjectBtn.addEventListener("click", openProject);
els.addLayoutPhotoBtn.addEventListener("click", () => els.layoutPhotoInput.click());
els.quickCutBtn.addEventListener("click", () => els.quickCutInput.click());
els.addVideoBtn.addEventListener("click", () => els.videoInput.click());
els.addMusicBtn.addEventListener("click", () => els.musicInput.click());
els.photoInput.addEventListener("change", addPhotoClip);
els.layoutPhotoInput.addEventListener("change", addLayoutPhotoClip);
els.quickCutInput.addEventListener("change", addQuickCutPhotos);
els.videoInput.addEventListener("change", addVideoClip);
els.musicInput.addEventListener("change", addMusicClip);
els.projectInput.addEventListener("change", openProjectFromInput);
els.addSubtitleBtn.addEventListener("click", addSubtitleClip);
els.addNarrationBtn.addEventListener("click", addNarrationClip);
els.clearBtn.addEventListener("click", clearAll);
els.aspectSelect.addEventListener("change", () => {
  setCanvasSize();
  drawAtTime(state.playhead);
});
els.previewBtn.addEventListener("click", previewTimeline);
els.auditionAudioBtn.addEventListener("click", auditionCurrentAudio);
els.stopBtn.addEventListener("click", stopPreview);
els.backBtn.addEventListener("click", () => movePlayhead(state.playhead - 1));
els.forwardBtn.addEventListener("click", () => movePlayhead(state.playhead + 1));
els.zoomInBtn.addEventListener("click", () => setZoom(state.pixelsPerSecond + 12));
els.zoomOutBtn.addEventListener("click", () => setZoom(state.pixelsPerSecond - 12));
els.deleteSelectedBtn.addEventListener("click", deleteSelectedClip);
els.deleteBtn.addEventListener("click", deleteSelectedClip);
els.duplicateBtn.addEventListener("click", () => copyClip(false, true));
els.recordBtn.addEventListener("click", startRecording);
els.stopRecordBtn.addEventListener("click", stopRecording);
els.narrationMode.addEventListener("change", updateNarrationModeUi);
els.renderBtn.addEventListener("click", renderVideo);
els.playBtn.addEventListener("click", () => {
  els.resultVideo.currentTime = 0;
  els.resultVideo.play();
});
els.timelineWrap.addEventListener("click", handleTimelineClick);
els.clipForm.addEventListener("input", updateSelectedFromForm);
document.addEventListener("keydown", handleKeyboard);

function addPhotoClip(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    addClip({
      layer: "photo",
      name: file.name,
      start: state.playhead,
      duration: defaultDuration(),
      url,
      image,
    });
  };
  image.src = url;
}

async function addLayoutPhotoClip(event) {
  const files = [...event.target.files];
  event.target.value = "";
  if (!files.length) return;

  const layout = els.photoLayoutSelect.value;
  const needed = photoCountForLayout(layout);
  const photos = await loadPhotoFiles(files.slice(0, needed));
  if (!photos.length) return;

  addClip({
    layer: "photo",
    name: layoutName(layout),
    start: state.playhead,
    duration: defaultDuration(),
    layout,
    photos,
  });
}

async function addQuickCutPhotos(event) {
  const files = [...event.target.files];
  event.target.value = "";
  if (!files.length) return;

  const photos = await loadPhotoFiles(files);
  const duration = quickCutDuration();
  photos.forEach((photo, index) => {
    state.clips.push({
      id: crypto.randomUUID(),
      layer: "photo",
      name: `快切 ${index + 1}`,
      start: state.playhead + index * duration,
      duration,
      image: photo.image,
      url: photo.url,
    });
  });
  state.selectedId = state.clips.at(-1)?.id || "";
  resetOutput();
  renderAll();
  setStatus(`已建立 ${photos.length} 張快切照片，每張 ${duration} 秒。`);
}

function loadPhotoFiles(files) {
  return Promise.all(files.map((file) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    return new Promise((resolve) => {
      image.onload = () => resolve({ name: file.name, url, image });
      image.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      image.src = url;
    });
  })).then((items) => items.filter(Boolean));
}

function addVideoClip(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.addEventListener("seeked", () => {
    if (activeClipsAt(state.playhead).some((clip) => clip.media === video)) {
      drawAtTime(state.playhead);
    }
  });
  els.mediaBin.appendChild(video);
  video.addEventListener("loadedmetadata", () => {
    addClip({
      layer: "video",
      name: file.name,
      start: state.playhead,
      duration: Number.isFinite(video.duration) ? Math.max(1, video.duration) : defaultDuration(),
      url,
      media: video,
    });
  }, { once: true });
}

function addMusicClip(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;

  const url = URL.createObjectURL(file);
  const audio = document.createElement("audio");
  audio.src = url;
  audio.preload = "metadata";
  els.mediaBin.appendChild(audio);
  audio.addEventListener("loadedmetadata", () => {
    addClip({
      layer: "music",
      name: file.name,
      start: state.playhead,
      duration: Number.isFinite(audio.duration) ? Math.max(1, audio.duration) : defaultDuration(),
      url,
      media: audio,
    });
  }, { once: true });
}

function addSubtitleClip() {
  addClip({
    layer: "subtitle",
    name: "字幕",
    start: state.playhead,
    duration: defaultDuration(),
    text: "請輸入字幕",
    lang: "zh-TW",
  });
}

function addNarrationClip() {
  const subtitle = activeClipsAt(state.playhead).find((clip) => clip.layer === "subtitle");
  addClip({
    layer: "narration",
    name: "AI 旁白",
    start: state.playhead,
    duration: subtitle?.duration || defaultDuration(),
    text: subtitle?.text || "請輸入旁白文字",
    lang: subtitle?.lang || "zh-TW",
  });
}

function createAiNarrationFromPlayhead() {
  const subtitle = activeClipsAt(state.playhead).find((clip) => clip.layer === "subtitle");
  const text = subtitle?.text || els.clipText.value || "請輸入旁白文字";
  addClip({
    layer: "narration",
    name: "AI 旁白",
    start: state.playhead,
    duration: subtitle?.duration || defaultDuration(),
    text,
    lang: subtitle?.lang || els.clipLanguage.value || "zh-TW",
    voiceURI: els.recordVoiceSelect.value || els.voiceSelect.value,
  });
}

function addClip(data) {
  const clip = {
    id: crypto.randomUUID(),
    start: 0,
    duration: defaultDuration(),
    text: "",
    ...data,
  };
  state.clips.push(clip);
  state.selectedId = clip.id;
  resetOutput();
  renderAll();
  setStatus(`已新增「${clip.name}」。`);
}

function clearAll() {
  stopPreview();
  speechSynthesis.cancel();
  state.clips.forEach(releaseClip);
  state.clips = [];
  state.selectedId = "";
  state.clipboard = null;
  state.playhead = 0;
  resetOutput();
  renderAll();
  drawEmptyCanvas();
  setStatus("已清空所有圖層。");
}

async function chooseCacheFolder() {
  if (!window.showDirectoryPicker) {
    setStatus("此 Chrome 環境不支援直接選擇資料夾，儲存時會改用下載暫存檔。");
    return;
  }
  try {
    state.cacheDirectoryHandle = await window.showDirectoryPicker({
      id: "video-project-cache",
      mode: "readwrite",
      startIn: "desktop",
    });
    setStatus("已選擇暫存資料夾。請確認是 C:/Users/tlri/OneDrive/Desktop/Codex-網頁程式/新資料夾。");
  } catch {
    setStatus("尚未選擇暫存資料夾。");
  }
}

async function saveProject() {
  if (!state.clips.length) {
    setStatus("目前沒有可暫存的片段。");
    return;
  }
  setStatus("正在整理素材並建立暫存檔。");
  const project = await buildProjectData();
  const json = JSON.stringify(project);

  if (state.cacheDirectoryHandle) {
    try {
      const fileHandle = await state.cacheDirectoryHandle.getFileHandle("video-project-cache.json", { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(json);
      await writable.close();
      setStatus("已儲存暫存檔：新資料夾/video-project-cache.json。");
      return;
    } catch {
      setStatus("寫入資料夾失敗，改為下載暫存檔。");
    }
  }

  downloadTextFile(json, "video-project-cache.json", "application/json");
  setStatus("已下載暫存檔。若要固定存到新資料夾，請先按「選擇暫存資料夾」。");
}

async function openProject() {
  if (window.showOpenFilePicker) {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{ description: "影片暫存專案", accept: { "application/json": [".json"] } }],
        multiple: false,
      });
      const file = await fileHandle.getFile();
      await loadProjectJson(await file.text());
      return;
    } catch {
      setStatus("請選擇先前儲存的 video-project-cache.json 暫存檔。");
    }
  }
  els.projectInput.click();
}

async function openProjectFromInput(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  await loadProjectJson(await file.text());
}

async function buildProjectData() {
  return {
    app: "layered-video-editor",
    version: 2,
    savedAt: new Date().toISOString(),
    settings: {
      aspect: els.aspectSelect.value,
      defaultDuration: els.defaultDurationInput.value,
      photoLayout: els.photoLayoutSelect.value,
      quickCutDuration: els.quickCutDuration.value,
      musicMixMode: els.musicMixMode.value,
    },
    clips: await Promise.all(state.clips.map(serializeClip)),
  };
}

async function serializeClip(clip) {
  const data = {
    id: clip.id,
    layer: clip.layer,
    name: clip.name,
    start: clip.start,
    duration: clip.duration,
    text: clip.text || "",
    lang: clip.lang || "zh-TW",
    layout: clip.layout || "",
    voiceURI: clip.voiceURI || "",
  };

  if (clip.photos?.length) {
    data.photos = await Promise.all(clip.photos.map(async (photo) => ({
      name: photo.name || "photo",
      dataUrl: await urlToDataUrl(photo.url),
    })));
  } else if (clip.layer === "photo" && clip.url) {
    data.asset = { name: clip.name, dataUrl: await urlToDataUrl(clip.url) };
  } else if (["video", "music", "narration"].includes(clip.layer) && clip.url) {
    data.asset = { name: clip.name, dataUrl: await urlToDataUrl(clip.url) };
  }
  return data;
}

async function loadProjectJson(json) {
  try {
    const project = JSON.parse(json);
    if (!Array.isArray(project.clips)) throw new Error("Invalid project");
    stopPreview();
    speechSynthesis.cancel();
    state.clips.forEach(releaseClip);
    state.clips = [];
    state.selectedId = "";
    state.playhead = 0;
    applyProjectSettings(project.settings || {});
    state.clips = await Promise.all(project.clips.map(rehydrateClip));
    state.clips = state.clips.filter(Boolean);
    resetOutput();
    renderAll();
    setStatus("已開啟暫存專案，可繼續編輯。");
  } catch {
    setStatus("暫存檔格式不正確，無法開啟。");
  }
}

function applyProjectSettings(settings) {
  if (settings.aspect) els.aspectSelect.value = settings.aspect;
  if (settings.defaultDuration) els.defaultDurationInput.value = settings.defaultDuration;
  if (settings.photoLayout) els.photoLayoutSelect.value = settings.photoLayout;
  if (settings.quickCutDuration) els.quickCutDuration.value = settings.quickCutDuration;
  if (settings.musicMixMode) els.musicMixMode.value = settings.musicMixMode;
  setCanvasSize();
}

async function rehydrateClip(data) {
  const clip = {
    id: data.id || crypto.randomUUID(),
    layer: data.layer,
    name: data.name || "片段",
    start: Number(data.start) || 0,
    duration: Math.max(0.1, Number(data.duration) || defaultDuration()),
    text: data.text || "",
    lang: data.lang || "zh-TW",
    layout: data.layout || "",
    voiceURI: data.voiceURI || "",
  };

  if (clip.layer === "photo" && data.photos?.length) {
    clip.photos = await Promise.all(data.photos.map(async (photo) => {
      const image = await imageFromDataUrl(photo.dataUrl);
      return { name: photo.name || "photo", url: photo.dataUrl, image };
    }));
  } else if (clip.layer === "photo" && data.asset?.dataUrl) {
    clip.url = data.asset.dataUrl;
    clip.image = await imageFromDataUrl(data.asset.dataUrl);
  } else if (["video", "music", "narration"].includes(clip.layer) && data.asset?.dataUrl) {
    const blob = dataUrlToBlob(data.asset.dataUrl);
    clip.url = URL.createObjectURL(blob);
    clip.media = createMediaElement(clip.layer, clip.url);
  }
  return clip;
}

function releaseClip(clip) {
  if (clip.url) URL.revokeObjectURL(clip.url);
  clip.photos?.forEach((photo) => URL.revokeObjectURL(photo.url));
  if (clip.media?.parentNode) clip.media.parentNode.removeChild(clip.media);
}

function renderAll() {
  renderTimeline();
  renderInspector();
  updateReadouts();
  drawAtTime(state.playhead);
}

function renderTimeline() {
  const total = Math.max(12, Math.ceil(totalDuration()) + 2);
  const width = total * state.pixelsPerSecond;
  document.documentElement.style.setProperty("--pixels-per-second", `${state.pixelsPerSecond}px`);
  document.documentElement.style.setProperty("--timeline-width", `${width}px`);

  els.ruler.innerHTML = "";
  for (let second = 0; second <= total; second += tickStep(total)) {
    const tick = document.createElement("div");
    tick.className = "tick";
    tick.style.left = `${second * state.pixelsPerSecond}px`;
    tick.textContent = formatTime(second);
    els.ruler.appendChild(tick);
  }

  els.timelineRows.innerHTML = "";
  layers.forEach((layer) => {
    const label = document.createElement("div");
    label.className = "layer-label";
    label.innerHTML = `<span class="folder-icon"></span><span>${layer.name}</span>`;
    els.timelineRows.appendChild(label);

    const track = document.createElement("div");
    track.className = "layer-track";
    track.dataset.layer = layer.id;
    track.style.minWidth = `${width}px`;

    state.clips
      .filter((clip) => clip.layer === layer.id)
      .sort((a, b) => a.start - b.start)
      .forEach((clip) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = `clip ${layer.className}${clip.id === state.selectedId ? " selected" : ""}`;
        item.style.left = `${clip.start * state.pixelsPerSecond}px`;
        item.style.width = `${Math.max(36, clip.duration * state.pixelsPerSecond)}px`;
        item.textContent = clip.text || clip.name;
        item.dataset.id = clip.id;
        item.addEventListener("click", (event) => {
          event.stopPropagation();
          state.selectedId = clip.id;
          movePlayhead(clip.start);
          renderAll();
        });
        track.appendChild(item);
      });

    els.timelineRows.appendChild(track);
  });

  positionPlayhead();
}

function tickStep(total) {
  if (total > 180) return 30;
  if (total > 60) return 10;
  return 5;
}

function renderInspector() {
  const clip = selectedClip();
  els.emptyInspector.hidden = Boolean(clip);
  els.clipForm.hidden = !clip;
  if (!clip) return;

  const layer = layers.find((item) => item.id === clip.layer);
  els.clipLayer.value = layer?.name || clip.layer;
  els.clipName.value = clip.name;
  els.clipStart.value = roundNumber(clip.start);
  els.clipDuration.value = roundNumber(clip.duration);
  els.clipText.value = clip.text || "";
  els.clipLanguage.value = clip.lang || "zh-TW";
  els.textField.hidden = !["subtitle", "narration"].includes(clip.layer);
  els.languageField.hidden = !["subtitle", "narration"].includes(clip.layer);
}

function updateSelectedFromForm() {
  const clip = selectedClip();
  if (!clip) return;

  clip.name = els.clipName.value.trim() || clip.name;
  clip.start = Math.max(0, Number(els.clipStart.value) || 0);
  clip.duration = Math.max(0.5, Number(els.clipDuration.value) || 0.5);
  if (["subtitle", "narration"].includes(clip.layer)) {
    clip.text = els.clipText.value;
    clip.lang = els.clipLanguage.value;
  }
  resetOutput();
  renderTimeline();
  updateReadouts();
  drawAtTime(state.playhead);
}

function handleTimelineClick(event) {
  const track = event.target.closest(".layer-track");
  if (!track) return;
  const rect = track.getBoundingClientRect();
  const second = (event.clientX - rect.left + track.scrollLeft) / state.pixelsPerSecond;
  movePlayhead(second);
}

function handleKeyboard(event) {
  const tag = document.activeElement?.tagName;
  const editingText = ["INPUT", "TEXTAREA", "SELECT"].includes(tag);
  if (editingText && !(event.ctrlKey || event.metaKey)) return;

  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === "c") {
    event.preventDefault();
    copyClip(false, false);
  }
  if ((event.ctrlKey || event.metaKey) && key === "x") {
    event.preventDefault();
    copyClip(true, false);
  }
  if ((event.ctrlKey || event.metaKey) && key === "v") {
    event.preventDefault();
    pasteClip();
  }
  if (event.key === "Delete" && !editingText) {
    event.preventDefault();
    deleteSelectedClip();
  }
}

function copyClip(cut, duplicateNow) {
  const clip = selectedClip();
  if (!clip) return;
  state.clipboard = { ...clip, id: "", media: clip.media, image: clip.image };
  if (cut) deleteSelectedClip(false);
  if (duplicateNow) pasteClip(clip.start + clip.duration);
  setStatus(cut ? "已剪下片段，可用 Ctrl+V 貼上。" : "已複製片段，可用 Ctrl+V 貼上。");
}

function pasteClip(start = state.playhead) {
  if (!state.clipboard) return;
  const clone = {
    ...state.clipboard,
    id: crypto.randomUUID(),
    start,
  };
  state.clips.push(clone);
  state.selectedId = clone.id;
  resetOutput();
  renderAll();
  setStatus("已貼上片段。");
}

function deleteSelectedClip(showStatus = true) {
  const index = state.clips.findIndex((clip) => clip.id === state.selectedId);
  if (index < 0) return;
  const [clip] = state.clips.splice(index, 1);
  state.selectedId = "";
  resetOutput();
  renderAll();
  if (showStatus) setStatus(`已刪除「${clip.name}」。`);
}

function movePlayhead(second) {
  state.playhead = Math.max(0, Math.min(Math.max(totalDuration(), 0), second));
  updateReadouts();
  positionPlayhead();
  drawAtTime(state.playhead);
}

function positionPlayhead() {
  els.playhead.style.left = `${state.playhead * state.pixelsPerSecond}px`;
}

function updateReadouts() {
  els.timeReadout.textContent = formatTime(state.playhead);
  els.durationReadout.textContent = `總長 ${formatTime(totalDuration())}`;
}

function setZoom(value) {
  state.pixelsPerSecond = Math.max(24, Math.min(140, value));
  renderTimeline();
}

function setCanvasSize() {
  if (els.aspectSelect.value === "9:16") {
    els.canvas.width = 720;
    els.canvas.height = 1280;
    els.canvas.style.aspectRatio = "9 / 16";
  } else if (els.aspectSelect.value === "1:1") {
    els.canvas.width = 1080;
    els.canvas.height = 1080;
    els.canvas.style.aspectRatio = "1 / 1";
  } else {
    els.canvas.width = 1280;
    els.canvas.height = 720;
    els.canvas.style.aspectRatio = "16 / 9";
  }
}

function drawAtTime(second) {
  const active = activeClipsAt(second);
  const visual = visualSourceAt(second);
  const subtitles = active.filter((clip) => clip.layer === "subtitle");
  ctx.fillStyle = "#101416";
  ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);

  if (visual?.layer === "photo") {
    drawPhotoClip(visual);
  } else if (visual?.layer === "video") {
    drawVideoClip(visual, second);
  } else {
    drawEmptyCanvas(false);
  }

  subtitles.forEach((clip) => drawCaption(clip.text, clip.lang));
}

function visualSourceAt(second) {
  const active = activeClipsAt(second);
  const activeVideos = active.filter((clip) => clip.layer === "video");
  const activePhotos = active.filter((clip) => clip.layer === "photo");
  return activeVideos.at(-1) || activePhotos.at(-1);
}

function drawPhotoClip(clip) {
  if (clip.photos?.length) {
    drawPhotoLayout(clip);
    return;
  }
  drawImageContain(clip.image);
}

function drawPhotoLayout(clip) {
  const slots = layoutSlots(clip.layout);
  slots.forEach((slot, index) => {
    const photo = clip.photos[index] || clip.photos[clip.photos.length - 1];
    if (!photo?.image) return;
    drawImageCover(photo.image, slot.x, slot.y, slot.width, slot.height);
  });
}

function layoutSlots(layout) {
  const w = els.canvas.width;
  const h = els.canvas.height;
  const gap = Math.max(8, Math.round(w * 0.012));
  if (layout === "twoPortrait" || layout === "twoLandscape") {
    return [
      { x: 0, y: 0, width: (w - gap) / 2, height: h },
      { x: (w + gap) / 2, y: 0, width: (w - gap) / 2, height: h },
    ];
  }
  if (layout === "leftStackRightPortrait") {
    return [
      { x: 0, y: 0, width: (w - gap) / 2, height: (h - gap) / 2 },
      { x: 0, y: (h + gap) / 2, width: (w - gap) / 2, height: (h - gap) / 2 },
      { x: (w + gap) / 2, y: 0, width: (w - gap) / 2, height: h },
    ];
  }
  if (layout === "leftPortraitRightStack") {
    return [
      { x: 0, y: 0, width: (w - gap) / 2, height: h },
      { x: (w + gap) / 2, y: 0, width: (w - gap) / 2, height: (h - gap) / 2 },
      { x: (w + gap) / 2, y: (h + gap) / 2, width: (w - gap) / 2, height: (h - gap) / 2 },
    ];
  }
  return [{ x: 0, y: 0, width: w, height: h }];
}

function drawImageContain(media) {
  const mediaWidth = media.videoWidth || media.naturalWidth || media.width;
  const mediaHeight = media.videoHeight || media.naturalHeight || media.height;
  if (!mediaWidth || !mediaHeight) return;
  const scale = Math.min(els.canvas.width / mediaWidth, els.canvas.height / mediaHeight);
  const width = mediaWidth * scale;
  const height = mediaHeight * scale;
  ctx.drawImage(media, (els.canvas.width - width) / 2, (els.canvas.height - height) / 2, width, height);
}

function drawImageCover(media, x, y, width, height) {
  const mediaWidth = media.videoWidth || media.naturalWidth || media.width;
  const mediaHeight = media.videoHeight || media.naturalHeight || media.height;
  if (!mediaWidth || !mediaHeight) return;
  const scale = Math.max(width / mediaWidth, height / mediaHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (mediaWidth - sourceWidth) / 2;
  const sourceY = (mediaHeight - sourceHeight) / 2;
  ctx.save();
  ctx.fillStyle = "#101416";
  ctx.fillRect(x, y, width, height);
  ctx.drawImage(media, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  ctx.restore();
}

function drawVideoClip(clip, second) {
  const video = clip.media;
  const localTime = Math.max(0, Math.min(video.duration || clip.duration, second - clip.start));
  if (Number.isFinite(video.duration) && Math.abs(video.currentTime - localTime) > 0.12) {
    video.currentTime = localTime;
  }
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    drawImageContain(video);
  }
}

function drawEmptyCanvas(withText = true) {
  setCanvasSize();
  ctx.fillStyle = "#101416";
  ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);
  if (!withText) return;
  ctx.fillStyle = "#dbe7e2";
  ctx.font = `${Math.round(els.canvas.width * 0.035)}px Microsoft JhengHei, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("新增素材後會在這裡預覽", els.canvas.width / 2, els.canvas.height / 2);
}

function drawCaption(text, lang = "zh-TW") {
  if (!text?.trim()) return;
  const fontSize = Math.max(28, Math.round(els.canvas.width * 0.038));
  const lineHeight = Math.round(fontSize * 1.35);
  const maxWidth = els.canvas.width * 0.82;
  ctx.font = `700 ${fontSize}px ${fontFamilyForLang(lang)}`;
  const lines = wrapText(text.trim(), maxWidth).slice(0, 3);
  const boxHeight = lines.length * lineHeight + 34;
  const boxY = els.canvas.height - boxHeight - Math.round(els.canvas.height * 0.045);

  ctx.fillStyle = "rgba(0, 0, 0, 0.66)";
  roundRect(els.canvas.width * 0.07, boxY, els.canvas.width * 0.86, boxHeight, 8);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, index) => {
    ctx.fillText(line, els.canvas.width / 2, boxY + 17 + lineHeight * index + lineHeight / 2);
  });
}

function fontFamilyForLang(lang) {
  if (lang === "ja-JP") return `"Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif`;
  if (lang === "en-US") return `Arial, "Segoe UI", sans-serif`;
  return `"Microsoft JhengHei", "Noto Sans TC", sans-serif`;
}

function wrapText(text, maxWidth) {
  const chunks = text.split(/\s+/);
  const lines = [];
  let line = "";
  chunks.forEach((chunk) => {
    const test = line ? `${line} ${chunk}` : chunk;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      return;
    }
    if (line) lines.push(line);
    line = chunk;
  });
  if (line) lines.push(line);
  return lines.flatMap((entry) => splitLongLine(entry, maxWidth));
}

function splitLongLine(line, maxWidth) {
  if (ctx.measureText(line).width <= maxWidth) return [line];
  const lines = [];
  let current = "";
  for (const char of line) {
    if (ctx.measureText(current + char).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

async function previewTimeline() {
  if (!state.clips.length) {
    setStatus("請先新增素材。");
    return;
  }
  stopPreview();
  state.isPlaying = true;
  setStatus("正在試播時間軸。");
  const start = performance.now() - state.playhead * 1000;
  const spoken = new Set();
  await playAudioAt(state.playhead, spoken, true);

  function tick(now) {
    if (!state.isPlaying) return;
    const second = (now - start) / 1000;
    movePlayhead(second);
    syncMediaAudio(second, true);
    activeClipsAt(second)
      .filter((clip) => clip.layer === "narration" && clip.text && !spoken.has(clip.id))
      .forEach((clip) => {
        spoken.add(clip.id);
        speak(clip.text, clip.lang, clip.voiceURI);
      });
    if (second >= totalDuration()) {
      stopPreview();
      return;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

async function auditionCurrentAudio() {
  stopPreview();
  const spoken = new Set();
  const found = await playAudioAt(state.playhead, spoken, false);
  if (!found) {
    setStatus("目前播放頭位置沒有背景音樂或旁白片段，請把播放頭移到音訊片段上再試聽。");
  }
}

function stopPreview() {
  state.isPlaying = false;
  speechSynthesis.cancel();
  state.clips.forEach((clip) => {
    if (clip.media && ["music", "narration"].includes(clip.layer)) {
      clip.media.pause();
    }
  });
}

async function playAudioAt(second, spoken, quiet) {
  const activeAudio = activeClipsAt(second).filter((clip) => clip.layer === "music" || clip.layer === "narration");
  if (!activeAudio.length) return false;
  const mediaResult = await syncMediaAudio(second, true);
  activeAudio
    .filter((clip) => clip.layer === "narration" && clip.text && !spoken.has(clip.id))
    .forEach((clip) => {
      spoken.add(clip.id);
      speak(clip.text, clip.lang, clip.voiceURI);
    });
  if (!quiet) {
    setStatus(mediaResult.blocked ? "Chrome 阻擋了音訊播放，請再按一次試聽或試播。" : "正在試聽目前播放頭的音訊。");
  }
  return true;
}

function syncMediaAudio(second, shouldPlay) {
  const narrationActive = hasActiveNarration(second);
  const result = { blocked: false, activeCount: 0 };
  state.clips
    .filter((clip) => ["music", "narration"].includes(clip.layer) && clip.media)
    .forEach((clip) => {
      const active = second >= clip.start && second < clip.start + clip.duration;
      const removeMusic = clip.layer === "music" && narrationActive && els.musicMixMode.value === "remove";
      if (!active || !shouldPlay || removeMusic) {
        clip.media.pause();
        return;
      }
      result.activeCount += 1;
      if (clip.layer === "music") {
        clip.media.volume = narrationActive && els.musicMixMode.value === "duck" ? 0.22 : 0.85;
      } else {
        clip.media.volume = 1;
      }
      const localTime = Math.max(0, second - clip.start);
      if (Math.abs(clip.media.currentTime - localTime) > 0.3) {
        clip.media.currentTime = localTime;
      }
      if (clip.media.paused) {
        clip.media.play().catch(() => {
          result.blocked = true;
          setStatus("Chrome 阻擋了音訊播放，請按「試聽目前音訊」或「試播」再啟動一次。");
        });
      }
    });
  return result;
}

function hasActiveNarration(second) {
  return state.clips.some((clip) => clip.layer === "narration" && second >= clip.start && second < clip.start + clip.duration);
}

async function startRecording() {
  if (els.narrationMode.value === "ai") {
    createAiNarrationFromPlayhead();
    setStatus("已建立 AI 旁白片段，可在時間軸選取後調整文字與語言。");
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("此瀏覽器不支援麥克風錄音。");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.recordChunks = [];
    state.recorder = new MediaRecorder(stream);
    state.recordStartedAt = performance.now();
    state.recorder.ondataavailable = (event) => {
      if (event.data.size) state.recordChunks.push(event.data);
    };
    state.recorder.onstop = () => finishRecording(stream);
    state.recorder.start();
    els.recordBtn.disabled = true;
    els.stopRecordBtn.disabled = false;
    setStatus("錄音中，預覽畫面會停在目前字幕位置。");
  } catch {
    setStatus("未取得麥克風權限，無法建立旁白錄音。");
  }
}

function stopRecording() {
  if (state.recorder?.state === "recording") {
    state.recorder.stop();
  }
}

function finishRecording(stream) {
  stream.getTracks().forEach((track) => track.stop());
  const blob = new Blob(state.recordChunks, { type: "audio/webm" });
  const url = URL.createObjectURL(blob);
  const audio = document.createElement("audio");
  audio.src = url;
  audio.preload = "metadata";
  audio.controls = true;
  els.mediaBin.appendChild(audio);
  const duration = Math.max(0.5, (performance.now() - state.recordStartedAt) / 1000);
  addClip({
    layer: "narration",
    name: "錄音旁白",
    start: state.playhead,
    duration,
    url,
    media: audio,
  });
  els.recordBtn.disabled = false;
  els.stopRecordBtn.disabled = true;
  els.recordPreview.src = url;
  els.recordPreview.hidden = false;
  state.recorder = null;
  setStatus("已建立旁白錄音片段。");
}

function updateNarrationModeUi() {
  const isAi = els.narrationMode.value === "ai";
  els.recordVoiceField.hidden = !isAi;
  els.recordBtn.textContent = isAi ? "建立 AI 旁白" : "開始錄音";
  els.stopRecordBtn.hidden = isAi;
  els.recordPreview.hidden = isAi || !els.recordPreview.src;
}

async function renderVideo() {
  if (!state.clips.length) {
    setStatus("請先新增素材。");
    return;
  }
  stopPreview();
  resetOutput();
  els.renderBtn.disabled = true;
  els.progress.value = 0;
  const audioCapture = await getTabAudioCapture();
  const stream = els.canvas.captureStream(30);
  audioCapture?.getAudioTracks().forEach((track) => stream.addTrack(track));
  const outputMimeType = chooseMimeType(Boolean(audioCapture));
  const recorder = new MediaRecorder(stream, { mimeType: outputMimeType });
  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  const done = new Promise((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || outputMimeType || "video/webm" }));
  });

  const duration = Math.max(0.5, totalDuration());
  const start = performance.now();
  const spoken = new Set();
  recorder.start(250);

  await new Promise((resolve) => {
    function tick(now) {
      const second = Math.min(duration, (now - start) / 1000);
      state.playhead = second;
      drawAtTime(second);
      if (audioCapture) syncMediaAudio(second, true);
      activeClipsAt(second)
        .filter((clip) => audioCapture && clip.layer === "narration" && clip.text && !spoken.has(clip.id))
        .forEach((clip) => {
          spoken.add(clip.id);
          speak(clip.text, clip.lang, clip.voiceURI);
        });
      els.progress.value = Math.min(99, (second / duration) * 100);
      if (second >= duration) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  speechSynthesis.cancel();
  syncMediaAudio(duration + 1, false);
  recorder.stop();
  const blob = await done;
  audioCapture?.getTracks().forEach((track) => track.stop());
  state.videoUrl = URL.createObjectURL(blob);
  els.resultVideo.src = state.videoUrl;
  els.resultVideo.classList.add("ready");
  els.playBtn.disabled = false;
  els.downloadLink.href = state.videoUrl;
  els.downloadLink.classList.remove("disabled");
  els.progress.value = 100;
  els.renderBtn.disabled = false;
  setStatus(audioCapture ? "影片已完成，可下載 WebM 影片並上傳 YouTube。" : "影片已完成，可下載 WebM 影片並上傳 YouTube；若要含音訊，請勾選錄入分頁音訊。");
  renderAll();
}

async function getTabAudioCapture() {
  if (!els.captureAudioToggle.checked) return null;
  if (!navigator.mediaDevices?.getDisplayMedia) return null;
  try {
    setStatus("請在 Chrome 選擇分享此分頁，並勾選分享分頁音訊。");
    const capture = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    capture.getVideoTracks().forEach((track) => track.stop());
    if (!capture.getAudioTracks().length) {
      capture.getTracks().forEach((track) => track.stop());
      return null;
    }
    return capture;
  } catch {
    return null;
  }
}

function chooseMimeType(hasAudio) {
  const candidates = hasAudio
    ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
    : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "video/webm";
}

async function urlToDataUrl(url) {
  const blob = await fetch(url).then((response) => response.blob());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, content] = dataUrl.split(",");
  const mime = header.match(/data:([^;]+)/)?.[1] || "application/octet-stream";
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function imageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function createMediaElement(layer, url) {
  const media = document.createElement(layer === "video" ? "video" : "audio");
  media.src = url;
  media.preload = "metadata";
  if (layer === "video") {
    media.muted = true;
    media.playsInline = true;
    media.addEventListener("seeked", () => {
      if (activeClipsAt(state.playhead).some((clip) => clip.media === media)) {
        drawAtTime(state.playhead);
      }
    });
  }
  if (layer === "narration") media.controls = true;
  els.mediaBin.appendChild(media);
  return media;
}

function downloadTextFile(text, filename, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function resetOutput() {
  if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
  state.videoUrl = "";
  els.resultVideo.removeAttribute("src");
  els.resultVideo.classList.remove("ready");
  els.playBtn.disabled = true;
  els.downloadLink.href = "#";
  els.downloadLink.classList.add("disabled");
  els.progress.value = 0;
}

function activeClipsAt(second) {
  return state.clips.filter((clip) => second >= clip.start && second < clip.start + clip.duration);
}

function selectedClip() {
  return state.clips.find((clip) => clip.id === state.selectedId);
}

function totalDuration() {
  return state.clips.reduce((max, clip) => Math.max(max, clip.start + clip.duration), 0);
}

function defaultDuration() {
  const value = Number(els.defaultDurationInput.value);
  return Math.max(1, Math.min(60, Number.isFinite(value) ? value : 4));
}

function quickCutDuration() {
  const value = Number(els.quickCutDuration.value);
  return Math.max(0.1, Math.min(1, Number.isFinite(value) ? value : 0.3));
}

function photoCountForLayout(layout) {
  if (layout === "single") return 1;
  return ["leftStackRightPortrait", "leftPortraitRightStack"].includes(layout) ? 3 : 2;
}

function layoutName(layout) {
  const names = {
    single: "單張照片版型",
    twoPortrait: "兩張直式並排",
    twoLandscape: "兩張橫式並排",
    leftStackRightPortrait: "左二右一照片版型",
    leftPortraitRightStack: "左一右二照片版型",
  };
  return names[layout] || "照片版型頁";
}

function formatTime(value) {
  const total = Math.max(0, Math.floor(value));
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function roundNumber(value) {
  return Math.round(value * 10) / 10;
}

function setStatus(text) {
  els.statusText.textContent = text;
}

function speak(text, lang = "zh-TW", voiceURI = "") {
  if (!text?.trim()) return;
  const utterance = new SpeechSynthesisUtterance(text.trim());
  const selectedVoice = state.voices.find((item) => item.voiceURI === (voiceURI || els.voiceSelect.value));
  const languageVoice = state.voices.find((item) => item.lang?.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2)));
  const selectedMatchesLang = selectedVoice?.lang?.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2));
  const voice = selectedMatchesLang ? selectedVoice : languageVoice || selectedVoice;
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang || lang;
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
}

function loadVoices() {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return;
  const source = voices.filter((voice) => /zh|en|ja/i.test(voice.lang));
  state.voices = (source.length ? source : voices).slice(0, 8);
  els.voiceSelect.innerHTML = "";
  els.recordVoiceSelect.innerHTML = "";
  state.voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = voice.voiceURI;
    option.textContent = `${voiceLabel(index)}：${voice.name} (${voice.lang})`;
    els.voiceSelect.appendChild(option);
    els.recordVoiceSelect.appendChild(option.cloneNode(true));
  });
}

function voiceLabel(index) {
  return ["男聲 1", "男聲 2", "女聲 1", "女聲 2"][index] || "語音";
}

setCanvasSize();
drawEmptyCanvas();
renderTimeline();
updateReadouts();
loadVoices();
updateNarrationModeUi();
speechSynthesis.addEventListener("voiceschanged", loadVoices);
