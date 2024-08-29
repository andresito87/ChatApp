<script lang="ts">
  import { navigate } from "svelte-routing";
  import { authToken } from "../stores/auth";
  //import "../styles/header.css";
  const name = authToken.getPayload()?.name || "User";

  // Remove the token from the store and redirect to login page
  function logout() {
    authToken.remove();
    navigate("/login");
  }
</script>
