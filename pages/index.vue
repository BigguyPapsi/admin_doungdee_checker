<template>
  <div>
    <v-container>
      <!-- TOKEN SECTION -->
      <v-card class="pa-4 mb-4" outlined>
        <div class="text-h6 mb-4">Token Manager</div>

        <v-text-field v-model="token" outlined clearable label="Enter Token" />

        <div class="d-flex">
          <v-btn color="primary" class="mr-2" @click="saveToken" elevation="0">
           <v-icon size="medium">mdi-content-save-outline</v-icon> Save Token
          </v-btn>

          <v-btn color="red" dark @click="clearStorage" elevation="0"> <v-icon size="medium">mdi-cancel</v-icon> Clear Token </v-btn>
        </div>
      </v-card>

      <!-- TEXTAREA -->
      <v-row>
        <v-col cols="6">
          <v-textarea
            rows="10"
            v-model="text"
            outlined
            hide-details
            label="Enter bill numbers"
        /></v-col>
        <v-col cols="6">
          <div class="pa-4 grey lighten-4 rounded">
            <div class="d-flex justify-space-between align-center mb-2">
              <strong>Input Array</strong>

              <div>
                <v-btn
                  elevation="0"
                  dark
                  small
                  color="red"
                  class="mr-2"
                  @click="clearText"
                >
                  <v-icon size="medium">mdi-cancel</v-icon> Clear
                </v-btn>

                <v-btn elevation="0" small color="primary" @click="copyText">
                  <v-icon size="medium">mdi-content-copy</v-icon> Copy
                </v-btn>
              </div>
            </div>

            <code>{{ formattedOutput }}</code>
          </div>
        </v-col>
      </v-row>

      <!-- ACTION BUTTON -->
      <div class="mb-4 mt-2">
        <v-btn
          color="success"
          dark
          elevation="0"
          :loading="loadingSaleHistory"
          @click="sendSaleHistory"
        >
           <v-icon>mdi-text-search-variant</v-icon> Send SaleHistory
        </v-btn>
      </div>

      <!-- SALE HISTORY RESPONSE -->
      <div class="mt-4 pa-4 grey lighten-4 rounded">
        <div class="d-flex justify-space-between align-center mb-2">
          <strong>SaleHistory Response</strong>

          <v-btn
            elevation="0"
            small
            color="primary"
            @click="copySaleHistoryResponse"
          >
           <v-icon size="medium">mdi-content-copy</v-icon> Copy
          </v-btn>
        </div>

        <div
          v-for="(item, index) in saleHistoryResponse"
          :key="index"
          class="mb-2"
        >
          <span>
            {{ item.response?.[0]?.billNumber || item.billNo }} -
            {{
              item.response?.[0]?.saleStatusName === "ຂາຍໄດ້"
                ? "✅ຂາຍໄດ້"
                : item.response?.[0]?.saleStatusName === "ຍົກເລີກ"
                ? "❌ຍົກເລີກ"
                : "ERROR"
            }}
          </span>
        </div>
      </div>

      <!-- SNACKBAR -->
      <v-snackbar
        v-model="snackbar"
        :color="snackbarColor"
        timeout="2000"
        top
        right
      >
        {{ snackbarText }}
      </v-snackbar>
    </v-container>
  </div>
</template>

<script>
export default {
  data() {
    return {
      token: "",

      loadingSaleHistory: false,
      saleHistoryResponse: [],

      text: "",

      snackbar: false,
      snackbarText: "",
      snackbarColor: "success",
    };
  },

  mounted() {
    const savedToken = localStorage.getItem("token");

    if (savedToken) {
      this.token = savedToken;
    }
  },

  computed: {
    output() {
      return this.text
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item !== "");
    },

    formattedOutput() {
      return JSON.stringify(this.output, null, 2);
    },

    formattedSaleHistoryResponse() {
      return this.saleHistoryResponse
        .map((item) => {
          const status =
            item.response?.[0]?.saleStatusName === "ຂາຍໄດ້"
              ? "✅ຂາຍໄດ້"
              : item.response?.[0]?.saleStatusName === "ຍົກເລີກ"
              ? "❌ຍົກເລີກ"
              : "ERROR";

          return `${item.response?.[0]?.billNumber || item.billNo} - ${status}`;
        })
        .join("\n");
    },
  },

  methods: {
    showSnackbar(text, color = "success") {
      this.snackbarText = text;
      this.snackbarColor = color;
      this.snackbar = true;
    },

    async sendSaleHistory() {
      if (this.output.length === 0) {
        this.showSnackbar("Please input bill numbers", "error");
        return;
      }

      try {
        this.loadingSaleHistory = true;

        this.saleHistoryResponse = [];

        for (const billNo of this.output) {
          // AUTO GET ROUND ID FROM FIRST 5 DIGITS
          const roundId = String(billNo).substring(0, 5);

          try {
            const res = await this.$axios.$post(
              "https://laolot.digital:7899/api/Sale/SaleHistory",
              {
                billNo,
                roundId,
              },
              {
                headers: {
                  Authorization: `Bearer ${this.token}`,
                },
              }
            );

            this.saleHistoryResponse.push({
              billNo,
              roundId,
              success: true,
              response: res,
            });
          } catch (error) {
            this.saleHistoryResponse.push({
              billNo,
              roundId,
              success: false,
              error: error.response?.data || error.message,
            });
          }
        }

        this.showSnackbar("SaleHistory completed!", "success");
      } catch (error) {
        console.error(error);

        this.showSnackbar("SaleHistory failed!", "error");
      } finally {
        this.loadingSaleHistory = false;
      }
    },

    async copySaleHistoryResponse() {
      try {
        await navigator.clipboard.writeText(this.formattedSaleHistoryResponse);

        this.showSnackbar("Response copied!", "success");
      } catch (error) {
        console.error(error);

        this.showSnackbar("Copy failed!", "error");
      }
    },

    async copyText() {
      try {
        await navigator.clipboard.writeText(this.formattedOutput);

        this.showSnackbar("Copied!", "success");
      } catch (err) {
        console.error(err);

        this.showSnackbar("Copy failed!", "error");
      }
    },

    clearText() {
      this.text = "";
      this.saleHistoryResponse = [];

      this.showSnackbar("Textarea cleared!", "info");
    },

    saveToken() {
      if (!this.token) {
        this.showSnackbar("Please enter token", "error");
        return;
      }

      localStorage.setItem("token", this.token);

      this.showSnackbar("Token saved in localStorage!", "success");
    },

    clearStorage() {
      localStorage.removeItem("token");

      this.token = "";

      this.showSnackbar("Token cleared!", "warning");
    },
  },
};
</script>

<style scoped>
code {
  display: block;
  padding: 12px;
  border-radius: 8px;
  background: #1e1e1e;
  color: #42ff87;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}
</style>
