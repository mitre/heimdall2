<template>
    <div v-if="isVisible" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <button class="close-button" @click="close">X</button>
        <slot></slot>
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
  }
  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    position: relative;
    color: black;
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
  </style>