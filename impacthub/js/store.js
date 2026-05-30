// store.js — Eenvoudige state-laag voor het ImpactHub-prototype.
// Houdt de app-state vast en bewaart wijzigingen in localStorage, zodat
// posts, likes en profielwijzigingen blijven staan als je de pagina herlaadt.

window.Store = (function () {
  const KEY = 'impacthub_state_v1';

  // Diepe kopie van de seed, zodat we de originele data niet vervuilen.
  function freshState() {
    return JSON.parse(JSON.stringify(window.SEED));
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Kon opgeslagen state niet laden, start vers.', e);
    }
    return freshState();
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Kon state niet opslaan.', e);
    }
  }

  // Abonnees worden geroepen na elke wijziging, zodat de UI hertekent.
  const listeners = [];
  function subscribe(fn) { listeners.push(fn); }
  function emit() { save(); listeners.forEach((fn) => fn()); }

  // ---- Lezers ----
  function getState() { return state; }
  function me() { return state.users.find((u) => u.id === state.currentUserId); }
  function user(id) { return state.users.find((u) => u.id === id); }
  function isConnected(id) {
    const m = me();
    return m.connectionIds.includes(id);
  }

  // Mensen die je nog niet kent — voor "Misschien ken je".
  function suggestions(limit = 3) {
    const m = me();
    return state.users
      .filter((u) => u.id !== m.id && !m.connectionIds.includes(u.id))
      .slice(0, limit);
  }

  // Posts gesorteerd op nieuwste eerst.
  function feed() {
    return [...state.posts].sort((a, b) => b.time - a.time);
  }

  // ---- Schrijvers ----
  function addPost(text, tags) {
    state.posts.push({
      id: 'p-' + Date.now(),
      authorId: state.currentUserId,
      time: Date.now(),
      text: text.trim(),
      tags: tags || [],
      likedBy: [],
      comments: [],
    });
    emit();
  }

  function deletePost(postId) {
    state.posts = state.posts.filter((p) => p.id !== postId);
    emit();
  }

  function toggleLike(postId) {
    const post = state.posts.find((p) => p.id === postId);
    if (!post) return;
    const me = state.currentUserId;
    const i = post.likedBy.indexOf(me);
    if (i === -1) post.likedBy.push(me);
    else post.likedBy.splice(i, 1);
    emit();
  }

  function addComment(postId, text) {
    const post = state.posts.find((p) => p.id === postId);
    if (!post || !text.trim()) return;
    post.comments.push({
      id: 'c-' + Date.now(),
      authorId: state.currentUserId,
      time: Date.now(),
      text: text.trim(),
    });
    emit();
  }

  function toggleConnection(userId) {
    const m = me();
    const i = m.connectionIds.indexOf(userId);
    if (i === -1) m.connectionIds.push(userId);
    else m.connectionIds.splice(i, 1);
    emit();
  }

  function updateProfile(fields) {
    const m = me();
    Object.assign(m, fields);
    emit();
  }

  // Sollicitaties / aanmeldingen — alleen lokaal bijgehouden voor de demo.
  function toggleJobApplied(jobId) {
    state.appliedJobs = state.appliedJobs || [];
    const i = state.appliedJobs.indexOf(jobId);
    if (i === -1) state.appliedJobs.push(jobId);
    else state.appliedJobs.splice(i, 1);
    emit();
  }
  function hasApplied(jobId) {
    return (state.appliedJobs || []).includes(jobId);
  }

  function toggleEventGoing(eventId) {
    state.goingEvents = state.goingEvents || [];
    const i = state.goingEvents.indexOf(eventId);
    if (i === -1) state.goingEvents.push(eventId);
    else state.goingEvents.splice(i, 1);
    emit();
  }
  function isGoing(eventId) {
    return (state.goingEvents || []).includes(eventId);
  }

  function reset() {
    state = freshState();
    emit();
  }

  return {
    subscribe, getState, me, user, isConnected, suggestions, feed,
    addPost, deletePost, toggleLike, addComment, toggleConnection,
    updateProfile, toggleJobApplied, hasApplied, toggleEventGoing, isGoing,
    reset,
  };
})();
