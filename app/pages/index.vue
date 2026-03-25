<script setup lang="ts">
useSeoMeta({
  title: 'Horizon Forum',
  description:
    'Une landing page epuree pour convaincre les visiteurs de rejoindre un forum clair, vivant et accueillant.',
})

const navItems = [
  { label: 'Explorer', href: '#explorer' },
  { label: 'Participer', href: '#participer' },
  { label: 'Confiance', href: '#confiance' },
]

const heroPills = ['Lire avant de rejoindre', 'Poster avec un compte', 'Des echanges mieux tenus']

const heroHighlights = [
  'Espaces faciles a parcourir',
  'Reponses visibles au bon moment',
  'Un ton plus calme, plus utile',
]

const forums = [
  {
    name: 'Annonces & lancement',
    description: 'Les infos utiles et les moments forts de la communaute.',
    topics: '12 sujets',
  },
  {
    name: 'Questions produit',
    description: 'Un espace clair pour demander, aider et debloquer vite.',
    topics: '34 sujets',
  },
  {
    name: 'Idees & retours',
    description: 'Partager une suggestion sans perdre le fil de la conversation.',
    topics: '18 sujets',
  },
]

const participationPoints = [
  'Ouvrez un sujet en quelques mots',
  'Repondez sans casser le rythme',
  'Retrouvez facilement vos echanges',
]

const trustPoints = [
  {
    title: 'Lecture ouverte',
    text: "Chacun peut decouvrir l'ambiance avant de faire le premier pas.",
  },
  {
    title: 'Publication reservee aux membres',
    text: 'Les conversations restent plus nettes quand chacun participe avec un compte.',
  },
  {
    title: 'Moderation visible',
    text: 'Le cadre est la pour garder les echanges utiles, calmes et faciles a suivre.',
  },
]
</script>

<template>
  <div
    class="relative min-h-dvh overflow-x-hidden bg-[linear-gradient(180deg,#fbf7ef_0%,#f4eee5_52%,#eee6db_100%)] text-zinc-950 scheme-light-dark dark:bg-[linear-gradient(180deg,#0b0b0c_0%,#101114_48%,#16181d_100%)] dark:text-zinc-100"
  >
    <LandingOrbField />

    <header class="fixed inset-x-0 top-5 z-50 flex justify-center px-4">
      <nav
        class="relative flex w-full max-w-6xl items-center justify-between gap-4 overflow-hidden rounded-full border border-white/70 bg-white/65 px-4 py-3 shadow-[0_18px_40px_rgba(120,113,108,0.14)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/60 dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
      >
        <div
          class="pointer-events-none absolute inset-0 rounded-full opacity-40 mix-blend-soft-light [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.24),transparent_22%),radial-gradient(rgba(24,24,27,0.08)_0.7px,transparent_0.7px),radial-gradient(rgba(255,255,255,0.18)_0.55px,transparent_0.55px)] [background-position:center,center,0_0,4px_5px] [background-size:auto,auto,12px_12px,9px_9px] dark:opacity-30"
        />

        <div class="relative z-10 flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-white shadow-[0_16px_40px_rgba(28,25,23,0.2)] dark:bg-white dark:text-zinc-950"
          >
            <LandingIcon
              name="forum"
              size="sm"
            />
          </div>

          <div>
            <p class="text-sm font-semibold tracking-[-0.03em]">Horizon Forum</p>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">
              Des conversations qui donnent envie de revenir
            </p>
          </div>
        </div>

        <div
          class="relative z-10 hidden items-center gap-1 rounded-full bg-white/45 p-1 md:flex dark:bg-white/5"
        >
          <a
            v-for="item in navItems"
            :key="item.href"
            :href="item.href"
            class="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-white hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {{ item.label }}
          </a>
        </div>

        <div class="relative z-10 flex items-center gap-2">
          <LandingPill
            variant="ghost"
            class="hidden sm:inline-flex"
          >
            Connexion
          </LandingPill>

          <LandingPill variant="solid">
            <LandingIcon
              name="person_add"
              size="sm"
            />
            <span>Inscription</span>
          </LandingPill>
        </div>
      </nav>
    </header>

    <main class="relative z-10 pb-20 pt-28">
      <section class="flex min-h-[82svh] items-center px-6 py-16 lg:px-10">
        <div class="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div class="max-w-2xl">
            <LandingPill variant="glass">Horizon Forum</LandingPill>

            <LandingHeading
              as="h1"
              size="hero"
              class="mt-6 max-w-4xl"
            >
              Les conversations utiles meritent un lieu qui donne envie de revenir.
            </LandingHeading>

            <p class="mt-6 max-w-xl text-lg leading-8 text-zinc-600 sm:text-xl dark:text-zinc-300">
              Parcourez les espaces librement, observez l'activite et rejoignez la discussion quand
              vous etes pret.
            </p>

            <div class="mt-8 flex flex-wrap gap-3">
              <LandingPill
                v-for="pill in heroPills"
                :key="pill"
                variant="glass"
              >
                {{ pill }}
              </LandingPill>
            </div>

            <div class="mt-8 flex flex-wrap items-center gap-3">
              <LandingPill
                variant="solid"
                size="lg"
              >
                <LandingIcon
                  name="person_add"
                  size="md"
                />
                <span>Creer un compte</span>
              </LandingPill>

              <LandingPill
                variant="glass"
                size="lg"
              >
                <LandingIcon
                  name="login"
                  size="md"
                />
                <span>Se connecter</span>
              </LandingPill>
            </div>
          </div>

          <LandingWhiteCard noise>
            <LandingEyebrow>Aujourd'hui sur Horizon</LandingEyebrow>

            <LandingDarkCard
              variant="plain"
              padding="lg"
              class="mt-5"
            >
              <LandingPill variant="inverse">Discussion vedette</LandingPill>

              <LandingHeading
                as="h2"
                size="card"
                class="mt-5"
              >
                Comment partager les retours clients sans perdre le fil ?
              </LandingHeading>

              <p class="mt-4 max-w-md text-base leading-7 text-white/70 dark:text-zinc-600">
                Une question claire, des reponses utiles, et une communaute qui reste facile a
                suivre.
              </p>
            </LandingDarkCard>

            <div class="mt-5 flex flex-wrap gap-3">
              <LandingPill
                v-for="highlight in heroHighlights"
                :key="highlight"
                variant="glass"
              >
                {{ highlight }}
              </LandingPill>
            </div>
          </LandingWhiteCard>
        </div>
      </section>

      <section
        id="explorer"
        class="flex min-h-[82svh] items-center px-6 py-16 lg:px-10"
      >
        <div class="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div class="max-w-xl">
            <LandingEyebrow>Explorer</LandingEyebrow>

            <LandingHeading class="mt-4"> Trouvez tout de suite le bon espace. </LandingHeading>

            <p class="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
              Chaque forum donne un point d'entree clair. On comprend ou lire, ou poster, et ou
              revenir.
            </p>
          </div>

          <LandingWhiteCard>
            <LandingEyebrow>Apercu des forums</LandingEyebrow>

            <div class="mt-6 space-y-4">
              <LandingMutedCard
                v-for="forum in forums"
                :key="forum.name"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="max-w-sm">
                    <h3 class="text-xl font-semibold tracking-[-0.04em]">
                      {{ forum.name }}
                    </h3>
                    <p class="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                      {{ forum.description }}
                    </p>
                  </div>

                  <LandingPill variant="solid">
                    {{ forum.topics }}
                  </LandingPill>
                </div>
              </LandingMutedCard>
            </div>
          </LandingWhiteCard>
        </div>
      </section>

      <section
        id="participer"
        class="flex min-h-[82svh] items-center px-6 py-16 lg:px-10"
      >
        <div class="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <LandingWhiteCard>
            <LandingMutedCard padding="lg">
              <LandingPill variant="accent"> Publier simplement </LandingPill>

              <LandingHeading
                as="h3"
                size="card"
                class="mt-5"
              >
                Lancez un sujet sans alourdir la conversation.
              </LandingHeading>

              <p class="mt-4 max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-300">
                Un titre, un message, puis la discussion prend vie. Les reponses restent groupees,
                lisibles et faciles a reprendre plus tard.
              </p>
            </LandingMutedCard>

            <LandingDarkCard
              variant="plain"
              class="mt-5"
            >
              <LandingEyebrow tone="inverse"> Rythme naturel </LandingEyebrow>

              <LandingHeading
                as="h3"
                size="card"
                class="mt-3"
              >
                Les nouvelles reponses apparaissent au fil de la discussion.
              </LandingHeading>
            </LandingDarkCard>
          </LandingWhiteCard>

          <div class="max-w-xl">
            <LandingEyebrow>Participer</LandingEyebrow>

            <LandingHeading class="mt-4">
              Posez une question, lancez un sujet, revenez quand vous voulez.
            </LandingHeading>

            <p class="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
              Une fois inscrit, vous pouvez publier, repondre et retrouver vos messages dans un
              espace qui reste net meme quand l'activite monte.
            </p>

            <div class="mt-8 space-y-3">
              <LandingPill
                v-for="point in participationPoints"
                :key="point"
                variant="glass"
                size="block"
                class="flex w-full justify-start text-left"
              >
                {{ point }}
              </LandingPill>
            </div>
          </div>
        </div>
      </section>

      <section
        id="confiance"
        class="flex min-h-[82svh] items-center px-6 py-16 lg:px-10"
      >
        <div class="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div class="max-w-xl">
            <LandingEyebrow>Confiance</LandingEyebrow>

            <LandingHeading class="mt-4">
              Une communaute inspire confiance quand elle reste lisible.
            </LandingHeading>

            <p class="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
              La lecture reste ouverte, la publication demande un compte, et le cadre est la pour
              garder les echanges utiles.
            </p>
          </div>

          <LandingDarkCard variant="panel">
            <div class="space-y-4">
              <LandingMutedCard
                v-for="item in trustPoints"
                :key="item.title"
                tone="inverse"
              >
                <h3 class="text-xl font-semibold tracking-[-0.04em]">
                  {{ item.title }}
                </h3>
                <p class="mt-3 text-sm leading-7 text-white/65 dark:text-zinc-300">
                  {{ item.text }}
                </p>
              </LandingMutedCard>
            </div>
          </LandingDarkCard>
        </div>
      </section>

      <section class="flex min-h-[82svh] items-center px-6 py-16 lg:px-10">
        <div class="mx-auto w-full max-w-5xl">
          <LandingWhiteCard
            kind="cta"
            class="text-center"
          >
            <LandingPill variant="glass"> Rejoindre Horizon </LandingPill>

            <LandingHeading class="mx-auto mt-6 max-w-3xl">
              Rejoignez un forum pense pour garder les conversations utiles.
            </LandingHeading>

            <p class="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
              Entrez par curiosite. Restez pour la clarte, le rythme et la qualite des echanges.
            </p>

            <div class="mt-8 flex flex-wrap justify-center gap-3">
              <LandingPill
                variant="solid"
                size="lg"
              >
                <LandingIcon
                  name="person_add"
                  size="md"
                />
                <span>Creer un compte</span>
              </LandingPill>

              <LandingPill
                variant="glass"
                size="lg"
              >
                <LandingIcon
                  name="login"
                  size="md"
                />
                <span>Connexion</span>
              </LandingPill>
            </div>
          </LandingWhiteCard>
        </div>
      </section>
    </main>
  </div>
</template>
