<script lang="ts">
  import axios from "axios";
  import { API_HOST } from "../constants";
  import "../styles/chatPopup.css";
  import { _, locale } from "svelte-i18n";

  // Functions passed as props to the component from the parent(ChatListSideBar),
  // to be called when it is necessary
  export let onCreate: (newChatId: string) => void;
  export let onClose: () => void;

  // Stores the chat name entered by the user
  let chatName = "";
  // Stores the error message if any
  let errorMessage: string | null = null;

  async function createChat() {
    try {
      const response = await axios.post(`${API_HOST}/api/v1/chat/`, {
        name: chatName,
      });
      onCreate(response.data.data.id);
    } catch (error) {
      console.error("Error creating chat:", error);
      errorMessage = "Failed to create chat. Please try again later.";
    }
  }
</script>

<div class="popup">
  <div
    class="close-button"
    on:click={onClose}
    on:keydown|preventDefault={(e) => e.key === "Enter" && onClose()}
    role="button"
    tabindex="0"
  >
    X
  </div>
  {#if errorMessage}
    <div class="error">{errorMessage}</div>
  {/if}
  <input type="text" bind:value={chatName} placeholder="Enter chat name" />
  <button disabled={!chatName.length} on:click={createChat}>{$_("Create")}</button>
</div>
