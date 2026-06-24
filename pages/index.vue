<template>
  <div>
    <v-container>
      <v-card class="pa-4 mb-4" outlined>
        <h3 class="mb-2" style="color: #cc3366">Login</h3>

        <div class="mb-3">
          <strong>STATUS:</strong>

          <span
            :class="{
              'status-active': tokenStatus === 'Have token',
              'status-inactive': tokenStatus === 'No token',
              'status-expired':
                tokenStatus !== 'Have token' && tokenStatus !== 'No token',
            }"
          >
            {{
              tokenStatus === "Have token"
                ? "🟢 Active"
                : tokenStatus === "No token"
                ? "🔴 Inactive"
                : "🟠 Token expired"
            }}
          </span>
        </div>

        <div class="d-flex mt-5">
          <v-btn
            color="#CC3366"
            dark
            elevation="0"
            :loading="loadingLogin"
            class="mr-2"
            @click="login"
            >Login
            <v-icon>mdi-chevron-right</v-icon>
          </v-btn>

          <v-btn
            :disabled="tokenStatus === 'No token'"
            color="#CC3366"
            outlined
            elevation="0"
            @click="clearStorage"
          >
            <v-icon size="medium">mdi-delete</v-icon>
            Clear Token
          </v-btn>
        </div>
      </v-card>

      <v-card>
        <v-card-text>
          <v-row>
            <v-col cols="6">
              <v-textarea
                rows="15"
                v-model="text"
                outlined
                hide-details
                label="Enter bill numbers"
              />
            </v-col>

            <v-col cols="6">
              <div class="pa-4 grey lighten-4 rounded">
                <div class="d-flex justify-space-between align-center mb-2">
                  <strong
                    >Data amount:
                    {{ "(" + formattedOutput?.length + ")" }} items</strong
                  >

                  <div></div>
                </div>

                <!-- <code>{{ formattedOutput }}</code> -->
                <code class="overflow"
                  ><div v-for="(item, index) in formattedOutput" :key="index">
                    <b>{{ index + 1 }}- </b>{{ item }}
                  </div></code
                >
              </div>
            </v-col>
          </v-row>

          <!-- ACTION BUTTON -->
          <div class="mb-4 mt-2">
            <v-btn
              style="color: white"
              color="#CC3366"
              elevation="0"
              :disabled="tokenStatus !== 'Have token'"
              :loading="loadingSaleHistory"
              @click="sendSaleHistory"
            >
              <v-icon>mdi-check-circle</v-icon> Check staus
            </v-btn>

            <v-btn
              outlined
              elevation="0"
              :disabled="text.trim() === ''"
              color="#CC3366"
              class="mr-2"
              @click="clearText"
            >
              <v-icon>mdi-delete-sweep-outline</v-icon>
              Clear
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- SALE HISTORY RESPONSE -->
      <div class="mt-4 pa-4 grey lighten-4 rounded">
        <div class="d-flex justify-space-between align-center mb-2">
          <h3>Sale History Response:</h3>

          <v-btn
            style="color: white"
            :disabled="saleHistoryResponse.length === 0"
            elevation="0"
            color="#CC3366"
            @click="copySaleHistoryResponse"
          >
            <v-icon size="medium">mdi-content-copy</v-icon>
            Copy
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
                : item.response?.[0]?.saleStatusName === "ລໍຖ້າຊໍາລະ"
                ? "⏳ລໍຖ້າຊໍາລະ"
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
      username: "",
      password: "",
      loadingLogin: false,

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
    tokenStatus() {
      return this.token ? "Have token" : "No token";
    },

    output() {
      return this.text
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item !== "");
    },

    formattedOutput() {
      // return JSON.stringify(this.output, null, 2);
      return this.output;
    },

    formattedSaleHistoryResponse() {
      return this.saleHistoryResponse
        .map((item) => {
          const status =
            item.response?.[0]?.saleStatusName === "ຂາຍໄດ້"
              ? "✅ຂາຍໄດ້"
              : item.response?.[0]?.saleStatusName === "ຍົກເລີກ"
              ? "❌ຍົກເລີກ"
              : item.response?.[0]?.saleStatusName === "ລໍຖ້າຊໍາລະ"
              ? "⏳ລໍຖ້າຊໍາລະ"
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
    async login() {
      try {
        this.loadingLogin = true;

        const res = await this.$axios.$post(
          "https://laolot.digital:7899/api/Users/UserSigin",
          {
            passkey: "asdsadsakdajfafjsalfj",
            userName: "admin",
            password:
              "263FEC58861449AACC1C328A4AFF64AFF4C62DF4A2D50B3F207FA89B6E242C9AA778E7A8BAEFFEF85B6CA6D2E7DC16FF0A760D59C13C238F6BCDC32F8CE9CC62",
          }
        );

        const token = res.Token;

        localStorage.setItem("token", token);
        this.token = token;

        this.showSnackbar("Login success", "success");
      } catch (error) {
        console.error(error);
        this.showSnackbar("Login failed", "error");
      } finally {
        this.loadingLogin = false;
      }
    },

    async sendSaleHistory() {
      if (!this.token) {
        this.showSnackbar("No token. Please login first.", "error");
        return;
      }

      if (this.output.length === 0) {
        this.showSnackbar("Please input bill numbers", "error");
        return;
      }

      try {
        this.loadingSaleHistory = true;
        this.saleHistoryResponse = [];

        for (const billNo of this.output) {
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

    clearText() {
      this.text = "";
      this.saleHistoryResponse = [];
      this.showSnackbar("Textarea cleared!", "info");
    },

    clearStorage() {
      localStorage.clear();

      this.token = "";
      this.username = "";
      this.password = "";

      this.showSnackbar("LocalStorage cleared!", "warning");
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

.status-active {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 3px 6px;
  border-radius: 999px;
  font-weight: 600;
}

.status-inactive {
  background: #ffebee;
  color: #c62828;
  padding: 3px 6px;
  border-radius: 999px;
  font-weight: 600;
}

.status-expired {
  background: #fff3e0;
  color: #ef6c00;
  padding: 3px 6px;
  border-radius: 999px;
  font-weight: 600;
}

.overflow {
  background-color: lightblue;
  width: 100%;
  height: 355px;
  overflow: auto;
}
</style>
