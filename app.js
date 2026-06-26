const layerNames = {
  photo: "照片層",
  video: "影片層",
  subtitle: "字幕層",
  narration: "旁白層",
  music: "背景音樂層",
};

const state = {
  clips: [],
  selectedId: "",
  playhead: 0,
  folderHandle: null,
  videoUrl: "",
  playing: false,
  editing: true,
  recorder: null,
  recordChunks: [],
  recordStart: 0,
};

const $ = (id) => document.querySelector(`#${id}`);
const els = {
  loginScreen: $("loginScreen"),
  editorApp: $("editorApp"),
  loginForm: $("loginForm"),
  loginAccount: $("loginAccount"),
  loginPassword: $("loginPassword"),
  rememberLogin: $("rememberLogin"),
  clearLoginCacheBtn: $("clearLoginCacheBtn"),
  loginStatus: $("loginStatus"),
  logoutBtn: $("logoutBtn"),
  chooseFolderBtn: $("chooseFolderBtn"),
  saveProjectBtn: $("saveProjectBtn"),
  openProjectBtn: $("openProjectBtn"),
  editProjectBtn: $("editProjectBtn"),
  projectFileSelect: $("projectFileSelect"),
  folderStatus: $("folderStatus"),
  projectInput: $("projectInput"),
  photoInput: $("photoInput"),
  videoInput: $("videoInput"),
  musicInput: $("musicInput"),
  narrationInput: $("narrationInput"),
  addPhotoBtn: $("addPhotoBtn"),
  addVideoBtn: $("addVideoBtn"),
  addSubtitleBtn: $("addSubtitleBtn"),
  addMusicBtn: $("addMusicBtn"),
  addNarrationBtn: $("addNarrationBtn"),
  playBtn: $("playBtn"),
  stopBtn: $("stopBtn"),
  renderBtn: $("renderBtn"),
  downloadLink: $("downloadLink"),
  resultVideo: $("resultVideo"),
  progress: $("progress"),
  status: $("status"),
  canvas: $("canvas"),
  timeline: $("timeline"),
  timeInfo: $("timeInfo"),
  clipStart: $("clipStart"),
  clipDuration: $("clipDuration"),
  textSetting: $("textSetting"),
  clipText: $("clipText"),
  musicMode: $("musicMode"),
  deleteClipBtn: $("deleteClipBtn"),
  startRecordBtn: $("startRecordBtn"),
  stopRecordBtn: $("stopRecordBtn"),
  recordPreview: $("recordPreview"),
  mediaBin: $("mediaBin"),
};
const ctx = els.canvas.getContext("2d");

els.loginForm.addEventListener("submit", handleLogin);
els.loginAccount.addEventListener("change", () => loadCachedLogin(els.loginAccount.value.trim()));
els.clearLoginCacheBtn.addEventListener("click", clearLoginCache);
els.logoutBtn.addEventListener("click", logout);
els.chooseFolderBtn.addEventListener("click", chooseFolder);
els.saveProjectBtn.addEventListener("click", saveProject);
els.openProjectBtn.addEventListener("click", openProject);
els.editProjectBtn.addEventListener("click", continueEditing);
els.projectFileSelect.addEventListener("change", openSelectedProject);
els.projectInput.addEventListener("change", openProjectInput);
els.addPhotoBtn.addEventListener("click", () => els.photoInput.click());
els.addVideoBtn.addEventListener("click", () => els.videoInput.click());
els.addMusicBtn.addEventListener("click", () => els.musicInput.click());
els.addNarrationBtn.addEventListener("click", () => els.narrationInput.click());
els.addSubtitleBtn.addEventListener("click", addSubtitle);
els.photoInput.addEventListener("change", addPhotos);
els.videoInput.addEventListener("change", addVideo);
els.musicInput.addEventListener("change", addMusic);
els.narrationInput.addEventListener("change", addNarration);
els.playBtn.addEventListener("click", playPreview);
els.stopBtn.addEventListener("click", stopPreview);
els.renderBtn.addEventListener("click", renderVideo);
els.deleteClipBtn.addEventListener("click", deleteSelected);
els.startRecordBtn.addEventListener("click", startHumanRecording);
els.stopRecordBtn.addEventListener("click", stopHumanRecording);
els.clipStart.addEventListener("input", updateSelected);
els.clipDuration.addEventListener("input", updateSelected);
els.clipText.addEventListener("input", updateSelected);
els.timeline.addEventListener("click", (event) => {
  if (event.target.classList.contains("track")) {
    const rect = event.target.getBoundingClientRect();
    state.playhead = Math.max(0, (event.clientX - rect.left) / 50);
    drawAt(state.playhead);
    updateUi();
  }
});

function setStatus(text) {
  els.status.textContent = text;
}

function loginCacheKey(account = els.loginAccount.value.trim()) {
  return `video-editor-login:${account}`;
}

function initLogin() {
  const lastAccount = localStorage.getItem("video-editor-last-account") || "";
  if (lastAccount) {
    els.loginAccount.value = lastAccount;
    loadCachedLogin(lastAccount);
  }
  showLogin();
}

function showLogin() {
  els.loginScreen.hidden = false;
  els.editorApp.hidden = true;
  document.body.dataset.page = "login";
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

function showEditor() {
  els.loginScreen.hidden = true;
  els.editorApp.hidden = false;
  document.body.dataset.page = "editor";
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

function handleLogin(event) {
  event.preventDefault();
  const account = els.loginAccount.value.trim();
  const password = els.loginPassword.value;
  if (!account || !password) {
    els.loginStatus.textContent = "請輸入帳號與密碼。";
    return;
  }

  const cached = localStorage.getItem(loginCacheKey(account));
  if (cached) {
    try {
      const data = JSON.parse(cached);
      if (data.password && data.password !== password) {
        els.loginStatus.textContent = "密碼與快取資料不一致，請重新輸入。";
        return;
      }
    } catch {
      localStorage.removeItem(loginCacheKey(account));
    }
  }

  if (els.rememberLogin.checked) {
    localStorage.setItem(loginCacheKey(account), JSON.stringify({ password }));
    localStorage.setItem("video-editor-last-account", account);
  }
  els.loginStatus.textContent = "登入成功。";
  showEditor();
}

function loadCachedLogin(account) {
  const cached = localStorage.getItem(loginCacheKey(account));
  if (!cached) return;
  try {
    const data = JSON.parse(cached);
    els.loginPassword.value = data.password || "";
    els.rememberLogin.checked = Boolean(data.password);
    els.loginStatus.textContent = "已載入快取帳號密碼。";
  } catch {
    localStorage.removeItem(loginCacheKey(account));
  }
}

function clearLoginCache() {
  const account = els.loginAccount.value.trim();
  if (account) localStorage.removeItem(loginCacheKey(account));
  localStorage.removeItem("video-editor-last-account");
  els.loginPassword.value = "";
  els.rememberLogin.checked = false;
  els.loginStatus.textContent = "已清除登入快取。";
}

function logout() {
  stopPreview();
  showLogin();
  els.loginStatus.textContent = "已登出。";
}

function setCloudStatus(text) {
  els.cloudStatus.textContent = text;
}

function cloudLoginKey(account = els.cloudAccount.value.trim()) {
  return `video-editor-cloud-login:${account}`;
}

function loadCachedCloudLogin() {
  const account = els.cloudAccount.value.trim();
  if (!account) return;
  const cached = localStorage.getItem(cloudLoginKey(account));
  if (!cached) return;
  try {
    const data = JSON.parse(cached);
    els.cloudPassword.value = data.password || "";
    els.cloudApiUrl.value = data.apiUrl || els.cloudApiUrl.value;
    els.rememberCloudLogin.checked = true;
    setCloudStatus("已載入此帳號的快取登入資料");
  } catch {
    localStorage.removeItem(cloudLoginKey(account));
  }
}

function rememberCloudLoginIfNeeded() {
  const account = els.cloudAccount.value.trim();
  if (!account) return;
  if (!els.rememberCloudLogin.checked) {
    localStorage.removeItem(cloudLoginKey(account));
    return;
  }
  localStorage.setItem(cloudLoginKey(account), JSON.stringify({
    apiUrl: els.cloudApiUrl.value.trim(),
    password: els.cloudPassword.value,
  }));
}

function validateCloudForm() {
  const apiUrl = els.cloudApiUrl.value.trim().replace(/\/$/, "");
  const account = els.cloudAccount.value.trim();
  const password = els.cloudPassword.value;
  if (!apiUrl) {
    setCloudStatus("請先輸入雲端 API URL");
    return null;
  }
  if (!account || !password) {
    setCloudStatus("請輸入帳號與密碼");
    return null;
  }
  rememberCloudLoginIfNeeded();
  return { apiUrl, account, password };
}

async function cloudPost(path, body) {
  const auth = validateCloudForm();
  if (!auth) return null;
  const response = await fetch(`${auth.apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account: auth.account, password: auth.password, ...body }),
  });
  if (!response.ok) {
    throw new Error(`Cloud API ${response.status}`);
  }
  return response.json();
}

async function saveProjectToCloud() {
  try {
    setCloudStatus("正在儲存到雲端...");
    const project = await serializeProject();
    await cloudPost("/projects/save", { project });
    setCloudStatus("已儲存到此帳號的雲端暫存");
  } catch {
    setCloudStatus("雲端儲存失敗：請確認 API URL、帳密、CORS 與後端 /projects/save");
  }
}

async function openProjectFromCloud() {
  try {
    setCloudStatus("正在開啟雲端暫存...");
    const result = await cloudPost("/projects/open", {});
    if (!result?.project) {
      setCloudStatus("此帳號目前沒有雲端暫存影片");
      return;
    }
    await loadProject(JSON.stringify(result.project));
    setCloudStatus("已開啟此帳號的雲端暫存");
  } catch {
    setCloudStatus("雲端開啟失敗：請確認後端 /projects/open");
  }
}

function enableCollaboratorEditing() {
  els.collaboratorBox.hidden = false;
  setCloudStatus("已開放共同作者設定，請輸入共同作者帳號後發送通知");
}

async function sendCollaboratorInvite() {
  const collaborator = els.collaboratorAccount.value.trim();
  if (!collaborator) {
    setCloudStatus("請輸入共同作者帳號");
    return;
  }
  try {
    setCloudStatus("正在發送共同作者 Email 通知...");
    await cloudPost("/projects/share", {
      collaborator,
      notifyEmail: true,
    });
    setCloudStatus(`已邀請共同作者：${collaborator}`);
  } catch {
    setCloudStatus("邀請失敗：請確認後端 /projects/share 已設定 Email 寄送");
  }
}

function continueEditing() {
  setEditing(true);
  setStatus("已進入編輯模式，可繼續修改並按「儲存暫存」。");
}

function setEditing(enabled) {
  state.editing = enabled;
  const editableControls = [
    els.saveProjectBtn,
    els.addPhotoBtn,
    els.addVideoBtn,
    els.addSubtitleBtn,
    els.addMusicBtn,
    els.addNarrationBtn,
    els.startRecordBtn,
    els.clipStart,
    els.clipDuration,
    els.clipText,
    els.musicMode,
    els.deleteClipBtn,
    els.renderBtn,
  ];
  editableControls.forEach((control) => {
    if (control) control.disabled = !enabled;
  });
  els.editProjectBtn.disabled = enabled;
}

function addClip(clip) {
  if (!state.editing) return setStatus("請先按「繼續編輯」再新增或修改片段。");
  state.clips.push({
    id: crypto.randomUUID(),
    start: state.playhead,
    duration: 4,
    text: "",
    ...clip,
  });
  state.selectedId = state.clips.at(-1).id;
  resetOutput();
  updateUi();
}

async function addPhotos(event) {
  const files = [...event.target.files];
  event.target.value = "";
  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);
    const image = await loadImage(dataUrl);
    addClip({ layer: "photo", name: file.name, dataUrl, image });
    state.playhead += 4;
  }
  state.playhead = Math.max(0, state.playhead - 4);
  updateUi();
}

async function addVideo(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  const dataUrl = await fileToDataUrl(file);
  const media = createMedia("video", dataUrl);
  media.addEventListener("loadedmetadata", () => {
    addClip({ layer: "video", name: file.name, dataUrl, media, duration: media.duration || 4 });
  }, { once: true });
}

async function addMusic(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  const dataUrl = await fileToDataUrl(file);
  const media = createMedia("audio", dataUrl);
  media.addEventListener("loadedmetadata", () => {
    addClip({ layer: "music", name: file.name, dataUrl, media, duration: media.duration || totalDuration() || 4 });
  }, { once: true });
}

async function addNarration(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  const dataUrl = await fileToDataUrl(file);
  const media = createMedia("audio", dataUrl);
  media.addEventListener("loadedmetadata", () => {
    addClip({ layer: "narration", name: file.name, dataUrl, media, duration: media.duration || 4 });
  }, { once: true });
}

async function startHumanRecording() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("此瀏覽器不支援麥克風錄音。");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.recordChunks = [];
    state.recordStart = performance.now();
    state.recorder = new MediaRecorder(stream);
    state.recorder.ondataavailable = (event) => {
      if (event.data.size) state.recordChunks.push(event.data);
    };
    state.recorder.onstop = () => finishHumanRecording(stream);
    state.recorder.start();
    els.startRecordBtn.disabled = true;
    els.stopRecordBtn.disabled = false;
    setStatus("錄音中。停止後會建立旁白層片段，並可試聽。");
  } catch {
    setStatus("未取得麥克風權限，無法錄音。");
  }
}

function stopHumanRecording() {
  if (state.recorder?.state === "recording") {
    state.recorder.stop();
  }
}

async function finishHumanRecording(stream) {
  stream.getTracks().forEach((track) => track.stop());
  const blob = new Blob(state.recordChunks, { type: "audio/webm" });
  const dataUrl = await blobToDataUrl(blob);
  const media = createMedia("audio", dataUrl);
  const duration = Math.max(0.3, (performance.now() - state.recordStart) / 1000);
  addClip({
    layer: "narration",
    name: "人聲錄音",
    start: state.playhead,
    duration,
    dataUrl,
    media,
  });
  els.recordPreview.src = dataUrl;
  els.recordPreview.hidden = false;
  els.startRecordBtn.disabled = false;
  els.stopRecordBtn.disabled = true;
  state.recorder = null;
  setStatus("已新增人聲旁白片段，可按播放器試聽；產生影片時會一併輸出。");
}

function addSubtitle() {
  addClip({ layer: "subtitle", name: "字幕", duration: 4, text: "請輸入字幕" });
}

function createMedia(kind, src) {
  const media = document.createElement(kind);
  media.src = src;
  media.preload = "auto";
  media.crossOrigin = "anonymous";
  media.playsInline = true;
  if (kind === "video") media.muted = true;
  els.mediaBin.appendChild(media);
  return media;
}

function selectedClip() {
  return state.clips.find((clip) => clip.id === state.selectedId);
}

function updateSelected() {
  if (!state.editing) return;
  const clip = selectedClip();
  if (!clip) return;
  clip.start = Math.max(0, Number(els.clipStart.value) || 0);
  clip.duration = Math.max(0.1, Number(els.clipDuration.value) || 0.1);
  if (clip.layer === "subtitle") clip.text = els.clipText.value;
  resetOutput();
  updateUi();
}

function deleteSelected() {
  if (!state.editing) return setStatus("請先按「繼續編輯」再刪除片段。");
  state.clips = state.clips.filter((clip) => clip.id !== state.selectedId);
  state.selectedId = "";
  resetOutput();
  updateUi();
}

function updateUi() {
  renderTimeline();
  const clip = selectedClip();
  els.clipStart.value = clip ? round(clip.start) : "";
  els.clipDuration.value = clip ? round(clip.duration) : "";
  els.clipText.value = clip?.text || "";
  els.textSetting.hidden = clip?.layer !== "subtitle";
  els.timeInfo.textContent = `${formatTime(state.playhead)} / ${formatTime(totalDuration())}`;
  drawAt(state.playhead);
}

function renderTimeline() {
  els.timeline.innerHTML = "";
  for (const layer of ["photo", "video", "subtitle", "narration", "music"]) {
    const row = document.createElement("div");
    row.className = "row";
    const label = document.createElement("div");
    label.className = "label";
    label.textContent = layerNames[layer];
    const track = document.createElement("div");
    track.className = "track";
    track.dataset.layer = layer;
    for (const clip of state.clips.filter((item) => item.layer === layer)) {
      const item = document.createElement("button");
      item.className = `clip ${layer}${clip.id === state.selectedId ? " selected" : ""}`;
      item.style.left = `${clip.start * 50}px`;
      item.style.width = `${Math.max(38, clip.duration * 50)}px`;
      item.textContent = clip.text || clip.name;
      item.type = "button";
      item.addEventListener("click", (event) => {
        event.stopPropagation();
        state.selectedId = clip.id;
        state.playhead = clip.start;
        updateUi();
      });
      track.appendChild(item);
    }
    row.append(label, track);
    els.timeline.appendChild(row);
  }
}

function drawAt(second) {
  ctx.fillStyle = "#101416";
  ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);
  const visual = activeAt(second).filter((clip) => clip.layer === "video").at(-1)
    || activeAt(second).filter((clip) => clip.layer === "photo").at(-1);
  if (visual?.layer === "photo") drawContain(visual.image);
  if (visual?.layer === "video") {
    const local = Math.max(0, second - visual.start);
    if (Math.abs(visual.media.currentTime - local) > 0.15) visual.media.currentTime = local;
    if (visual.media.readyState >= 2) drawContain(visual.media);
  }
  for (const subtitle of activeAt(second).filter((clip) => clip.layer === "subtitle")) {
    drawCaption(subtitle.text);
  }
}

function drawContain(media) {
  const width = media.videoWidth || media.naturalWidth || media.width;
  const height = media.videoHeight || media.naturalHeight || media.height;
  if (!width || !height) return;
  const scale = Math.min(els.canvas.width / width, els.canvas.height / height);
  const w = width * scale;
  const h = height * scale;
  ctx.drawImage(media, (els.canvas.width - w) / 2, (els.canvas.height - h) / 2, w, h);
}

function drawCaption(text) {
  if (!text) return;
  ctx.font = "700 46px Microsoft JhengHei, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(0,0,0,.68)";
  ctx.fillRect(100, els.canvas.height - 140, els.canvas.width - 200, 92);
  ctx.fillStyle = "white";
  ctx.fillText(text, els.canvas.width / 2, els.canvas.height - 94, els.canvas.width - 240);
}

async function playPreview() {
  if (!state.clips.length) return setStatus("請先加入素材。");
  stopPreview();
  state.playing = true;
  const start = performance.now() - state.playhead * 1000;
  await startAudioElements(state.playhead);
  const tick = (now) => {
    if (!state.playing) return;
    state.playhead = (now - start) / 1000;
    drawAt(state.playhead);
    updateTimelineReadoutOnly();
    if (state.playhead >= totalDuration()) return stopPreview();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

async function startAudioElements(second) {
  for (const clip of state.clips.filter((item) => ["music", "narration"].includes(item.layer))) {
    const active = second >= clip.start && second < clip.start + clip.duration;
    clip.media.pause();
    if (!active) continue;
    clip.media.currentTime = second - clip.start;
    clip.media.volume = clip.layer === "music" && hasNarration(second) && els.musicMode.value === "duck" ? 0.22 : 1;
    if (clip.layer === "music" && hasNarration(second) && els.musicMode.value === "remove") continue;
    await clip.media.play().catch(() => setStatus("Chrome 阻擋音訊播放，請再按一次試播。"));
  }
}

function stopPreview() {
  state.playing = false;
  for (const clip of state.clips) clip.media?.pause();
}

async function renderVideo() {
  if (!state.clips.length) return setStatus("請先加入素材。");
  stopPreview();
  resetOutput();
  els.renderBtn.disabled = true;
  els.progress.value = 0;
  setStatus("正在產生影片，旁白與背景音樂會直接混入輸出檔。");

  const audio = await buildMixedAudioStream();
  const stream = els.canvas.captureStream(30);
  for (const track of audio.stream.getAudioTracks()) stream.addTrack(track);

  const mimeType = chooseMimeType();
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks = [];
  recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
  const done = new Promise((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
  });

  const duration = totalDuration();
  const started = performance.now();
  recorder.start(250);
  await audio.start();

  await new Promise((resolve) => {
    const tick = (now) => {
      const second = Math.min(duration, (now - started) / 1000);
      state.playhead = second;
      drawAt(second);
      els.progress.value = Math.min(99, (second / duration) * 100);
      updateTimelineReadoutOnly();
      if (second >= duration) return resolve();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  recorder.stop();
  const blob = await done;
  audio.close();
  state.videoUrl = URL.createObjectURL(blob);
  els.resultVideo.src = state.videoUrl;
  els.resultVideo.classList.add("ready");
  els.downloadLink.href = state.videoUrl;
  els.downloadLink.classList.remove("disabled");
  els.progress.value = 100;
  els.renderBtn.disabled = false;
  setStatus("影片已完成，輸出檔已包含旁白與背景音樂，可上傳 YouTube。");
}

async function buildMixedAudioStream() {
  const context = new AudioContext();
  const destination = context.createMediaStreamDestination();
  const scheduled = [];
  for (const clip of state.clips.filter((item) => ["music", "narration"].includes(item.layer) && item.dataUrl)) {
    const buffer = await fetch(clip.dataUrl).then((r) => r.arrayBuffer()).then((b) => context.decodeAudioData(b));
    const source = context.createBufferSource();
    source.buffer = buffer;
    const gain = context.createGain();
    gain.gain.value = clip.layer === "music" ? 0.85 : 1;
    if (clip.layer === "music") applyMusicDucking(gain, clip, context.currentTime);
    source.connect(gain).connect(destination);
    scheduled.push({ source, when: context.currentTime + clip.start, offset: 0, duration: Math.min(clip.duration, buffer.duration) });
  }
  return {
    stream: destination.stream,
    start: async () => {
      if (context.state === "suspended") await context.resume();
      for (const item of scheduled) item.source.start(item.when, item.offset, item.duration);
    },
    close: () => context.close(),
  };
}

function applyMusicDucking(gain, musicClip, baseTime) {
  if (els.musicMode.value === "keep") return;
  for (const narration of state.clips.filter((clip) => clip.layer === "narration")) {
    const start = Math.max(musicClip.start, narration.start);
    const end = Math.min(musicClip.start + musicClip.duration, narration.start + narration.duration);
    if (end <= start) continue;
    const localStart = baseTime + start;
    const localEnd = baseTime + end;
    gain.gain.setValueAtTime(0.85, localStart);
    gain.gain.linearRampToValueAtTime(els.musicMode.value === "remove" ? 0.0001 : 0.22, localStart + 0.15);
    gain.gain.setValueAtTime(els.musicMode.value === "remove" ? 0.0001 : 0.22, Math.max(localStart + 0.15, localEnd - 0.15));
    gain.gain.linearRampToValueAtTime(0.85, localEnd);
  }
}

async function chooseFolder() {
  if (!window.showDirectoryPicker) return setStatus("此瀏覽器不支援資料夾授權，請使用「開啟暫存檔」。");
  state.folderHandle = await window.showDirectoryPicker({ mode: "readwrite", startIn: "desktop" }).catch(() => null);
  if (!state.folderHandle) return;
  els.folderStatus.textContent = `已選擇資料夾：${state.folderHandle.name}`;
  await refreshProjectList();
}

async function refreshProjectList() {
  els.projectFileSelect.innerHTML = "<option value=''>選擇暫存檔</option>";
  if (!state.folderHandle) return;
  for await (const [name, handle] of state.folderHandle.entries()) {
    if (handle.kind === "file" && name.endsWith(".json")) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      els.projectFileSelect.appendChild(option);
    }
  }
}

async function saveProject() {
  if (!state.editing) return setStatus("請先按「繼續編輯」後再儲存暫存。");
  const text = JSON.stringify(await serializeProject());
  const filename = projectCacheFilename();
  if (state.folderHandle) {
    const file = await state.folderHandle.getFileHandle(filename, { create: true });
    const writable = await file.createWritable();
    await writable.write(text);
    await writable.close();
    await refreshProjectList();
    return setStatus(`已儲存到暫存資料夾/${filename}。`);
  }
  downloadText(text, filename);
  setStatus("已下載暫存檔；若要直接存到新資料夾，請先選擇暫存資料夾。");
}

function projectCacheFilename() {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ];
  return `video-project-cache-${parts.join("")}.json`;
}

async function openProject() {
  if (state.folderHandle) {
    await refreshProjectList();
    return setStatus("請從暫存檔清單選擇要開啟的 JSON。");
  }
  els.projectInput.click();
}

async function openSelectedProject() {
  if (!state.folderHandle || !els.projectFileSelect.value) return;
  const file = await state.folderHandle.getFileHandle(els.projectFileSelect.value).then((h) => h.getFile());
  await loadProject(await file.text());
}

async function openProjectInput(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (file) await loadProject(await file.text());
}

async function serializeProject() {
  return {
    version: 3,
    musicMode: els.musicMode.value,
    clips: state.clips.map((clip) => ({
      layer: clip.layer,
      name: clip.name,
      start: clip.start,
      duration: clip.duration,
      text: clip.text || "",
      dataUrl: clip.dataUrl || "",
    })),
  };
}

async function loadProject(text) {
  const data = JSON.parse(text);
  stopPreview();
  state.clips = [];
  for (const clip of data.clips || []) {
    const firstPhoto = clip.photos?.[0]?.dataUrl || "";
    const dataUrl = clip.dataUrl || clip.asset?.dataUrl || firstPhoto || "";
    const loaded = {
      ...clip,
      id: crypto.randomUUID(),
      dataUrl,
      text: clip.text || "",
      start: Number(clip.start) || 0,
      duration: Math.max(0.1, Number(clip.duration) || 4),
    };
    if (loaded.layer === "photo" && loaded.dataUrl) loaded.image = await loadImage(loaded.dataUrl);
    if (["video", "music", "narration"].includes(loaded.layer) && loaded.dataUrl) {
      loaded.media = createMedia(loaded.layer === "video" ? "video" : "audio", loaded.dataUrl);
    }
    state.clips.push(loaded);
  }
  if (data.musicMode) els.musicMode.value = data.musicMode;
  state.playhead = 0;
  state.selectedId = state.clips[0]?.id || "";
  resetOutput();
  updateUi();
  setEditing(false);
  setStatus("已開啟暫存檔。請按「繼續編輯」後即可修改並儲存。");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function downloadText(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function activeAt(second) {
  return state.clips.filter((clip) => second >= clip.start && second < clip.start + clip.duration);
}

function hasNarration(second) {
  return activeAt(second).some((clip) => clip.layer === "narration");
}

function totalDuration() {
  return Math.max(0.1, ...state.clips.map((clip) => clip.start + clip.duration));
}

function resetOutput() {
  if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
  state.videoUrl = "";
  els.resultVideo.removeAttribute("src");
  els.resultVideo.classList.remove("ready");
  els.downloadLink.href = "#";
  els.downloadLink.classList.add("disabled");
  els.progress.value = 0;
}

function chooseMimeType() {
  return ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type)) || "video/webm";
}

function formatTime(value) {
  const total = Math.max(0, Math.floor(value));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function updateTimelineReadoutOnly() {
  els.timeInfo.textContent = `${formatTime(state.playhead)} / ${formatTime(totalDuration())}`;
}

drawAt(0);
updateUi();
setEditing(true);
initLogin();
