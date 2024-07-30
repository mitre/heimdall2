<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <button class="close-button" @click="close">X</button>
      <div class="modal-body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    isVisible: {
      type: Boolean,
      required: true
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    }
  },
  methods: {
    close() {
      this.$emit('close');
    }
  }
};
</script>
<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  position: relative;
  color: black;
  width: 80%; /* Adjust width as needed */
  max-height: 80%; /* Ensure modal does not exceed 80% of viewport height */
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Enable vertical scrolling if content overflows */
}
.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: black;
}
.modal-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Ensure modal body can scroll if content overflows */
}
</style>
<style>
/* Global styles to prevent background scrolling */
.modal-open {
  overflow: hidden;
}
</style>