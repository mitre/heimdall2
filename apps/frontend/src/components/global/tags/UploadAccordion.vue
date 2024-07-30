<template>
  <div class="accordion">
    <div v-for="(item, index) in items" :key="index" class="accordion-item">
      <div class="accordion-header" @click="toggle(index)">
        {{ item.title }}
      </div>
      <div v-if="activeIndex === index" class="accordion-content">
        <slot :name="item.slotName"></slot>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    items: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      activeIndex: 0 // Set the first tab as active by default
    };
  },
  methods: {
    toggle(index) {
      this.activeIndex = this.activeIndex === index ? null : index;
    }
  }
};
</script>
<style scoped>
.accordion-item {
  border: 1px solid #ccc;
  margin-bottom: 10px;
}
.accordion-header {
  background: #f7f7f7;
  padding: 10px;
  cursor: pointer;
  text-align: left; /* Align text to the left */
}
.accordion-content {
  padding: 10px;
  background: #fff;
  text-align: left; /* Ensure text inside accordion tabs is aligned to the left */
  max-height: 300px; /* Set a max height for the accordion content */
  overflow-y: auto; /* Enable vertical scrolling if content overflows */
}
</style>