<template>
  <vx-card
    title="Compliance Level"
    subtitle="[Passed/(Passed + Failed + Not Reviewed + Profile Error) * 100]"
    class="card"
  >
    <div slot="no-body">
      <div class="vx-row text-center">
        <div class="vx-col sm:w-4/5 justify-center mx-auto">
          <vue-apex-charts
            id="chart"
            type="radialBar"
            height="350"
            :options="chartOptions"
            :series="getSeries(series)"
          />
        </div>
      </div>
    </div>
  </vx-card>
</template>

<script>
import VueApexCharts from "vue-apexcharts";
import { ResponsiveDirective } from "vue-responsive-components";

export default {
  data() {
    return {
      chartOptions: {
        chart: {
          dropShadow: {
            //for dark mode
            enabled: true,
            enabledOnSeries: undefined,
            top: 0,
            left: 0,
            blur: 3,
            color: "#fff",
            opacity: 0.35
          }
        },
        plotOptions: {
          radialBar: {
            size: 150,
            offsetY: 0,
            startAngle: -150,
            endAngle: 150,
            hollow: {
              size: "70%"
            },
            track: {
              background: "#fff",
              strokeWidth: "100%"
            },
            dataLabels: {
              value: {
                offsetY: 30,
                color: "#99a2ac",
                fontSize: "2rem"
              }
            }
          }
        },
        fill: {
          type: "solid",
          colors: [
            function({ value }) {
              if (value < 60) {
                return "#F02607"; //red
              } else if (value >= 60 && value < 90) {
                return "#EBDB02"; //yellow
              } else {
                return "#06BA00"; //green
              }
            }
          ]
        },
        stroke: {
          dashArray: 8
        },
        labels: ["Compliance Level"]
      }
    };
  },
  mounted() {
    const boxes = document.querySelectorAll("#chart");

    const myObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const width = Math.floor(entry.contentRect.width);
        if (width > 250) {
          this.chartOptions = {
            ...this.chartOptions,
            ...{
              plotOptions: {
                radialBar: {
                  size: 150,
                  offsetY: 0,
                  startAngle: -150,
                  endAngle: 150,
                  hollow: {
                    size: "70%"
                  },
                  track: {
                    background: "#fff",
                    strokeWidth: "100%"
                  },
                  dataLabels: {
                    value: {
                      offsetY: 30,
                      color: "#99a2ac",
                      fontSize: "2rem"
                    }
                  }
                }
              }
            }
          };
        } else {
          this.chartOptions = {
            ...this.chartOptions,
            ...{
              plotOptions: {
                radialBar: {
                  size: 125,
                  offsetY: 0,
                  startAngle: -150,
                  endAngle: 150,
                  hollow: {
                    size: "70%"
                  },
                  track: {
                    background: "#fff",
                    strokeWidth: "100%"
                  },
                  dataLabels: {
                    value: {
                      offsetY: 30,
                      color: "#99a2ac",
                      fontSize: "2rem"
                    }
                  }
                }
              }
            }
          };
        }
      }
    });

    boxes.forEach(box => {
      myObserver.observe(box);
    });
  },
  methods: {
    getSeries(series) {
      var sum = series.reduce((a, b) => a + b, 0);
      /// hack for no data loaded yet, to be fixed later
      sum <= 0 ? (sum = 0.00001) : sum;
      return [Math.round((series[0] * 1000.0) / sum) / 10];
    }
  },
  props: {
    series: Array
  },
  components: {
    VueApexCharts
  },
  directives: {
    responsive: ResponsiveDirective
  }
};
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-grow: 1;
  height: 107%; /*ehhh*/
}
</style>
