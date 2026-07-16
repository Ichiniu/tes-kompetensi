<script setup>
useHead({
  titleTemplate: (titleChunk) => {
    // Abaikan title lama jika masih nyangkut di cache server
    if (titleChunk && titleChunk.includes('Tunjangan Transport API')) {
      return 'Sistem Kepegawaian JMC';
    }
    return titleChunk ? `${titleChunk} - Sistem Kepegawaian JMC` : 'Sistem Kepegawaian JMC';
  }
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
