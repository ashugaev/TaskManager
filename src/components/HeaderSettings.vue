<template>

  <div class="settings-block"
       :class="{'settings-block_active': active}"
       style="height: 110px; position: relative;">
    <VuePerfectScrollbar style="width: 100%;">
      <div class="settings-block__abs"
           style="display: flex; position: absolute; top: 0; left: 0;">
        <div class="onePreview"
             v-for="(bg, index) in themes"
             :key="index"
             @click="changeBg(index); saveBg();"
             :style="{background: 'url(' + bg + ')'}">
        </div>
      </div>
    </VuePerfectScrollbar>
  </div>

</template>

<script>
import VuePerfectScrollbar from "vue-perfect-scrollbar";
//Директива клик снаружи элемента

export default {
  data() {
    return {};
  },
  methods: {
    changeBg(index) {
      this.$store.state.currentBgImg = this.themes[index];
    },
    saveBg() {
      this.$store.dispatch("saveBg");
    }
  },
  computed: {
    themes() {
      return this.$store.state.themes;
    }
  },

  components: {
    VuePerfectScrollbar
  },
  props: {
    active: Boolean
  }
};
</script>


<style lang="scss">
.settings-block {
  width: 100%;
  max-height: 0;
  transition: max-height 0.4s;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.3);
  display: flex;

  &_active {
    max-height: 500px;
  }
}

.onePreview {
  height: 90px;
  width: 90px;
  margin: 10px 5px;
  background-size: cover !important;
  background-position: center !important;

  &:first-child {
    margin-left: 10px;
  }

  &:last-child {
    margin-right: 10px;
  }
}

.settings-block {
  /////////////////////////
  // КАСТОМИЗАЦИЯ СКРОЛЛА
  /////////////////////////

  ////////ОБЫЧНОЕ СОТОЯНИЕ

  //Область скролла
  & .ps.ps--active-x > .ps__scrollbar-x-rail {
    display: block;
    background-color: #ffffff31;
    height: 5px;
    transition: height 0.3s;
    opacity: 1;
    border-radius: 0;
  }

  //скроллбар
  & .ps.ps--active-x > .ps__scrollbar-x-rail > .ps__scrollbar-x {
    background-color: #ffffff4b;
    height: 5px;
    transition: height 0.3s;
    // opacity: 1;
    border-radius: 0;
    bottom: 0;
  }

  ////////HOVER

  //Область скролла
  & .ps.ps--active-x > .ps__scrollbar-x-rail:hover {
    height: 5px;
    background-color: #ffffff31;
  }

  //скроллбар
  & .ps:hover > .ps__scrollbar-x-rail:hover > .ps__scrollbar-x {
    height: 5px;
    // padding: 0;
    background-color: rgba(255, 255, 255, 0.6);
    opacity: 1;
    border-radius: 0;
    bottom: 0;
  }

  //////АCTIVE

  & .ps__scrollbar-x-rail {
    top: -1px;
  }
  //область скролла
  & .ps:hover.ps--in-scrolling.ps--x > .ps__scrollbar-x-rail {
    background-color: #ffffff31;
    opacity: 1;
  }

  //скроллбар

  &
    .ps:hover.ps--in-scrolling.ps--x
    > .ps__scrollbar-x-rail
    > .ps__scrollbar-x {
    background-color: rgba(255, 255, 255, 0.6);
    opacity: 1;
  }

  //////АCTIVE NOT HOVER

  //область скролла
  & .ps.ps--in-scrolling.ps--x > .ps__scrollbar-x-rail {
    background-color: #ffffff31;
    opacity: 1;
    height: 5px;
  }

  //скроллбар

  & .ps.ps--in-scrolling.ps--x > .ps__scrollbar-x-rail > .ps__scrollbar-x {
    background-color: rgba(255, 255, 255, 0.6);
    opacity: 1;
    height: 5px;
  }
}
</style>
