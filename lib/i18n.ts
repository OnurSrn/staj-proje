import type { AppLanguage } from "@/lib/settings";

// Uygulamanın kendi UI metinleri için merkezi çeviri kaynağı. TMDB'den
// gelen film/kişi verileri (başlık, özet, tür adı vb.) bu görevde
// çevrilmiyor — yalnızca CineScope'un kendi yazdığı arayüz metinleri
// burada yaşar. Yeni bir bölüm eklerken component içine hardcode etmek
// yerine buraya bir key eklenir (bkz. görev talimatı bölüm 2/6).
const translations = {
  tr: {
    common: {
      previous: "← Önceki",
      next: "Sonraki →",
      page: "Sayfa",
      total: "Toplam",
      results: "sonuç",
      movies: "film",
      exploreMovies: "Filmleri Keşfet",
      searchMoviesCta: "Film Ara",
      retry: "Tekrar Dene",
      noPoster: "Poster bulunamadı",
      noProfileImage: "Görsel bulunamadı",
      noActorImage: "Oyuncu görseli bulunamadı",
      noDate: "Tarih yok",
      loadErrorTitle: "Filmler yüklenemedi",
      loadErrorDescription: "Sayfayı yenileyip tekrar dene.",
      clearFilters: "Filtreleri Temizle",
      average: "Ortalama",
      examplePrefix: "Örneğin:",
    },
    navbar: {
      movies: "Filmler",
      search: "Ara",
      whatToWatch: "Ne İzlesem",
      collections: "Koleksiyonlar",
      favorites: "Favoriler",
      watchlist: "İzleme Listesi",
      activity: "Aktivite",
      ratings: "Puanlar",
      profile: "Profil",
      about: "Hakkında",
      settings: "Ayarlar",
      openMenu: "Menüyü aç",
      closeMenu: "Menüyü kapat",
    },
    home: {
      eyebrow: "Film Keşif Uygulaması",
      title:
        "Filmleri keşfet, detaylarını incele ve kendi izleme listeni oluştur.",
      subtitle:
        "Film kategorilerini incele, tür seç ve sonuçları istediğin şekilde sırala.",
      browseEyebrow: "Keşfet",
      filteredMoviesTitle: "Filtrelenmiş Filmler",
      categoryMoviesSuffix: "Filmleri",
      activeFilters: "Aktif Filtreler",
      genreLabel: "Tür:",
      sortLabel: "Sıralama:",
      sortFieldLabel: "Sıralama",
      allGenres: "Tüm Türler",
      noResultsTitle: "Bu filtrelerle film bulunamadı",
      noResultsDescription: "Farklı bir tür veya sıralama seçeneği dene.",
      filterCta: "Filtrele",
    },
    categories: {
      popular: "Popüler",
      "top-rated": "En Çok Oy Alan",
      "now-playing": "Gösterimde",
      upcoming: "Yakında",
    },
    sorts: {
      "popularity.desc": "En Popüler",
      "vote_average.desc": "En Yüksek Puan",
      "primary_release_date.desc": "En Yeni",
    },
    search: {
      eyebrow: "Film Araması",
      title: "Film Ara",
      subtitle: "Aramak istediğin filmin adını yaz.",
      inputLabel: "Film adı",
      inputPlaceholder: "Örneğin: Interstellar",
      submit: "Ara",
      promptTitle: "Bir film aramaya başla",
      promptDescription:
        'Arama kutusuna bir film adı yaz ve "Ara" butonuna bas.',
      resultsForSuffix: "için sonuçlar",
      noResultsTitle: "Film bulunamadı",
      noResultsDescription: "Başka bir film adıyla tekrar arama yap.",
    },
    movieDetail: {
      eyebrow: "Film Detayları",
      summaryHeading: "Özet",
      noOverview: "Bu film için açıklama bulunmuyor.",
      creativeTeamHeading: "Yaratıcı Ekip",
      directorLabel: "Yönetmen",
      writerLabel: "Senaryo",
      cinematographerLabel: "Görüntü Yönetmeni",
      musicLabel: "Müzik",
      studiosHeading: "Stüdyolar",
      trailerEyebrow: "Resmi Video",
      trailerHeading: "Fragman",
      castEyebrow: "Oyuncu Kadrosu",
      castHeading: "Oyuncular",
      seriesHeading: "Serinin Filmleri",
      seriesDescription: "Bu filmin yer aldığı koleksiyondaki diğer yapımlar.",
      recommendedEyebrow: "Bunları da Beğenebilirsin",
      recommendedHeading: "Benzer Filmler",
      ratingPrefix: "Puan:",
      noRuntime: "Süre bilgisi yok",
      hourUnit: "saat",
      minuteUnit: "dakika",
      whereToWatchHeading: "Nerede İzlenir",
    },
    personDetail: {
      eyebrow: "Kişi Detayları",
      biographyHeading: "Biyografi",
      noBiography: "Bu kişi için biyografi bulunmuyor.",
      noBirthDate: "Doğum tarihi yok",
      noBirthPlace: "Doğum yeri yok",
      filmographyEyebrow: "Filmografi",
      filmographyHeading: "Filmleri",
      noMoviesTitle: "Film bulunamadı",
      noMoviesDescription: "Bu kişi için filmografi bilgisi bulunmuyor.",
      noCharacterInfo: "Karakter bilgisi yok",
    },
    collections: {
      eyebrow: "CiNeA Collections",
      title: "Koleksiyonlar",
      subtitle: "Ruh haline uygun tematik koleksiyonlardan birini seç.",
      cardEyebrow: "Koleksiyon",
      openCollectionCta: "Koleksiyonu Aç",
      detailEyebrow: "CiNeA Collection",
      noResultsTitle: "Bu koleksiyonda film bulunamadı",
      noResultsDescription: "Daha sonra tekrar dene.",
    },
    whatToWatch: {
      eyebrow: "Bu Akşam Ne İzlesem?",
      title: "Ne İzlesem",
      subtitle:
        "Ruh haline, vaktine ve kiminle izleyeceğine göre sana film önerelim.",
      promptTitle: "Tercihlerini seç, sana film önerelim",
      promptDescription:
        'Yukarıdaki formu doldurup "Film Öner" butonuna bas.',
      moodLabel: "Ruh Hâli",
      runtimeLabel: "Süre",
      intensityLabel: "Yoğunluk",
      companyLabel: "İzleme Ortamı",
      discoveryLabel: "Keşif Tercihi",
      genreLabel: "Film Türü",
      genreAnyOption: "Tür fark etmez",
      submit: "Film Öner",
      resultsEyebrow: "Senin İçin Seçtiklerimiz",
      personalizationLow:
        "Daha fazla filme puan verdikçe kişisel sıralama gelişir.",
      personalizationApplied:
        "Sonuçlar seçimlerine göre filtrelendi ve zevk profiline göre sıralandı.",
      noResultsTitle: "Bu tercihlerle film bulunamadı",
      noResultsDescription:
        'Daha geniş tercihler dene — örneğin süreyi "Fark etmez" yap ya da türü kaldır.',
      resetFormCta: "Formu Sıfırla",
    },
    moods: {
      fun: "Eğlenceli",
      exciting: "Heyecanlı",
      emotional: "Duygusal",
      dark: "Karanlık",
      cozy: "Rahat",
      thoughtful: "Düşündürücü",
    },
    runtimes: {
      short: "90 dakikadan kısa",
      medium: "90-120 dakika",
      long: "120 dakikadan uzun",
      any: "Fark etmez",
    },
    intensities: {
      light: "Hafif",
      balanced: "Dengeli",
      intense: "Yoğun",
    },
    companies: {
      alone: "Tek başıma",
      friends: "Arkadaşlarla",
      family: "Aileyle",
      partner: "Partnerle",
    },
    discoveries: {
      safe: "Güvenli seçim",
      balanced: "Dengeli",
      different: "Farklı bir şey",
    },
    forYou: {
      eyebrow: "Kişisel Öneriler",
      title: "Sana Özel",
      subtitle:
        "Öneriler, verdiğin puanlar, izleme durumların ve açık tercihlerinden hesaplanır.",
      privacyNote:
        "Zevk profilin bu cihazdaki yerel verilerden hesaplanır. Öneri adayı ararken yalnızca birkaç kısa filtre (ör. en sevdiğin birkaç tür/kişi id'si) sunucuya gönderilir; puanların, izleme geçmişin veya kimliğin hiçbir zaman kaydedilmez.",
      errorTitle: "Öneriler yüklenemedi",
      errorDescription: "TMDB'den veri alınırken bir sorun oluştu.",
      emptyProfileTitle:
        "Henüz kişisel öneri oluşturmak için yeterli verin yok.",
      emptyProfileDescription:
        "Birkaç filme puan ver, izleme durumu işaretle veya favori oyuncu/yönetmen/stüdyo ekle — öneriler burada belirmeye başlar.",
      addPreferencesCta: "Tercihlerini Ekle",
      whatToWatchCta: "Ne İzlesem?",
      lowConfidenceNote:
        "Daha fazla filme puan verdikçe öneriler sana daha iyi uyum sağlar.",
      noRecommendationsTitle: "Şu an için öneri bulunamadı",
      noRecommendationsDescription:
        "Daha fazla film puanladıkça veya tercih ekledikçe burada öneriler görünecek.",
      genericExplanation: "Genel kalite ve keşif önerisi",
    },
    confidence: {
      low: "Düşük Güven",
      medium: "Orta Güven",
      high: "Yüksek Güven",
    },
    tasteProfile: {
      heading: "Zevk Profilin",
      descriptionPrefix: "Bu profil verdiğin puanlar ve izleme durumlarına göre oluşur.",
      confidenceLow:
        "Henüz az veri var. Daha fazla filme puan verdikçe profilin daha güvenilir hale gelir.",
      confidenceMedium:
        "Makul sayıda puanlanmış film var; profil genel eğilimini yansıtıyor. Daha fazla filme puan verdikçe profilin daha güvenilir hale gelir.",
      confidenceHigh: "Zengin bir puanlama geçmişin var; profil oldukça güvenilir.",
      noDataText:
        "Henüz yeterli veri yok. Birkaç filme puan verdiğinde veya izleme durumu işaretlediğinde burada zevk profilin oluşmaya başlayacak.",
      favoriteGenresHeading: "Sevdiğin Türler",
      movieDnaHeading: "Movie DNA Eğilimlerin",
      preferredRuntimeHeading: "Tercih Ettiğin Süre",
      erasHeading: "Dönemler",
      languagesHeading: "Diller",
      noTrendText: "Henüz belirgin bir eğilim yok.",
      footerNote:
        "Profil bu cihazdaki yerel verilerden hesaplanır, henüz bir hesaba veya buluta kaydedilmez. Favori kişiler/stüdyolar açık tercihlerindir; tür ve Movie DNA eğilimleri ise puanlarından çıkarılan tahminlerdir.",
      runtimeNotDetermined: "Henüz belirlenemedi",
    },
    favorites: {
      eyebrow: "Koleksiyonun",
      title: "Favoriler",
      subtitle: "Favori olarak kaydettiğin filmler burada görüntülenir.",
      emptyTitle: "Henüz favori film yok",
      emptyDescription:
        "Film detay sayfasından favorilerine film ekleyebilirsin.",
    },
    watchlist: {
      eyebrow: "Sonra İzle",
      title: "İzleme Listesi",
      subtitle:
        "Daha sonra izlemek için kaydettiğin filmler burada görüntülenir.",
      emptyTitle: "İzleme listen şu anda boş",
      emptyDescription:
        "Film detay sayfasından watchlist listene film ekleyebilirsin.",
    },
    ratings: {
      eyebrow: "Kişisel İstatistikler",
      title: "Puanlar",
      subtitle:
        "Puanladığın filmleri ve kişisel istatistiklerini burada görebilirsin.",
      emptyTitle: "Henüz hiçbir filme puan vermedin",
      emptyDescription: "Bir film detay sayfasından kendi puanını verebilirsin.",
      totalRated: "Toplam Puanlanan Film",
      averageRating: "Ortalama Puan",
      distributionHeading: "Puan Dağılımı",
      ratedMoviesHeading: "Puanladığın Filmler",
      movieInfoErrorTitle: "Film bilgileri yüklenemedi",
      yourRatingPrefix: "Senin Puanın:",
    },
    profile: {
      eyebrow: "Yerel Profil",
      title: "Profil",
      subtitle:
        "Favorilerin, watchlist'in ve puanlarına dayalı kişisel özetin burada.",
      favoriteMovies: "Favori Film",
      watchlistMovies: "Watchlist Film",
      ratedMovies: "Puanlanan Film",
      highestRating: "En Yüksek Puan",
      lowestRating: "En Düşük Puan",
      favoriteActorsSuffix: "favori oyuncu",
      favoriteDirectorsSuffix: "favori yönetmen",
      favoriteStudiosSuffix: "favori stüdyo",
      personalRecommendationsCta: "Sana Özel Öneriler →",
      editPreferencesCta: "Tercihlerini Düzenle →",
      settingsCta: "Ayarlar →",
      ratingTrendHeading: "Değerlendirme Eğilimin",
      tasteSummaryHigh:
        "Seçici ama sevdiğinde yüksek puan veriyorsun.",
      tasteSummaryMedium: "Dengeli bir puanlama eğilimin var.",
      tasteSummaryLow: "Filmleri daha eleştirel değerlendiriyorsun.",
      emptyTasteTitle: "Zevk özeti için henüz veri yok",
      emptyTasteDescription:
        "Filmlere puan vermeye başladığında burada tür tercihlerini ve en sevdiğin filmleri görebilirsin.",
      goToRatingsCta: "Ratings Sayfasına Git",
      topGenresHeading: "En Çok Puanladığın Türler",
      topGenresEmptyText: "Tür istatistiği için yeterli veri yok.",
      favoriteMoviesHeading: "En Sevdiğin Filmler",
      favoriteMoviesEmptyText: "Gösterilecek film bulunamadı.",
    },
    activity: {
      eyebrow: "İzleme Aktivitesi",
      title: "Aktivite",
      subtitle:
        "İzlediğin, izlemekte olduğun ve izleme planındaki filmleri burada takip et.",
      emptyTitle: "Henüz izleme aktiviten yok",
      emptyDescription:
        "Bir film detay sayfasından izleme durumunu işaretleyebilirsin.",
      statWatched: "İzlenen",
      statWatching: "Şu An İzlenen",
      statDropped: "Yarım Bırakılan",
      statPlanToWatch: "İzleme Planında",
    },
    preferences: {
      eyebrow: "Tercihler",
      title: "Tercihler",
      subtitle:
        "Favori oyuncularını, yönetmenlerini ve yapım şirketlerini burada seç. Bu tercihler şimdilik yalnızca bu cihazda saklanır; henüz kişisel öneri veya CiNeA Match hesaplamasında kullanılmıyor.",
      section1Heading: "1. Favori Oyuncular",
      section2Heading: "2. Favori Yönetmenler",
      section3Heading: "3. Favori Stüdyolar",
      actorSearchLabel: "Oyuncu ara",
      directorSearchLabel: "Yönetmen ara",
      companySearchLabel: "Stüdyo ara",
      searchButton: "Ara",
      directorNote:
        'TMDB kişi araması rolü kesin göstermeyebilir; sonuçlar "Directing" departmanına göre önceliklendirilir ama nihai kararı departman etiketine bakarak sen verirsin.',
      actorPromptEmpty: "Bir oyuncu adı aramaya başla.",
      directorPromptEmpty: "Bir yönetmen adı aramaya başla.",
      companyPromptEmpty: "Bir yapım şirketi aramaya başla.",
      existingFavoritesHeading: "Mevcut Favorilerin",
      noFavoriteActors: "Henüz favori oyuncu eklemedin.",
      noFavoriteDirectors: "Henüz favori yönetmen eklemedin.",
      noFavoriteStudios: "Henüz favori stüdyo eklemedin.",
    },
    settings: {
      title: "Ayarlar",
      description: "Dil, görünüm ve bölge tercihlerini buradan yönetebilirsin.",
      languageSection: "Dil",
      themeSection: "Görünüm",
      regionSection: "Bölge",
      localDataTitle: "Yerel Veri",
      localDataNote: "Ayarların bu cihazda saklanır.",
      savedStatus: "Ayar kaydedildi",
      resetButton: "Varsayılanlara Dön",
      resetStatus: "Varsayılanlara dönüldü",
      isoCodeLabel: "Kod",
      summaryHeading: "Özet",
    },
    theme: {
      system: "Sistem",
      dark: "Koyu",
      light: "Açık",
    },
    language: {
      tr: "Türkçe",
      en: "English",
    },
    about: {
      eyebrow: "Proje Hakkında",
      paragraph1:
        "CineScope, Next.js ve TypeScript kullanılarak geliştirilen bir film keşif uygulamasıdır.",
      paragraph2:
        "Film verileri ve görselleri The Movie Database API üzerinden alınmaktadır.",
      paragraph3:
        "Proje kapsamında API entegrasyonu, dinamik route yapısı, Server Components, responsive tasarım ve kullanıcı listeleri gibi konular uygulanmaktadır.",
    },
    notFound: {
      eyebrow: "404",
      title: "Sayfa bulunamadı",
      description:
        "Aradığın film, kişi veya sayfa mevcut değil ya da kaldırılmış olabilir.",
      goHome: "Ana Sayfaya Dön",
    },
    errorPage: {
      eyebrow: "Bir hata oluştu",
      title: "Filmler şu anda yüklenemiyor",
      description:
        "İnternet bağlantısını veya TMDB API ayarlarını kontrol edip tekrar deneyebilirsin.",
    },
    movieActions: {
      addFavorite: "Favorilere Ekle",
      removeFavorite: "Favorilerden Çıkar",
      addWatchlist: "Watchlist'e Ekle",
      removeWatchlist: "Watchlist'ten Çıkar",
    },
    ratingStatus: {
      watched: "İzledim",
      watching: "İzliyorum",
      dropped: "Yarım Bıraktım",
      planToWatch: "Daha Sonra İzle",
      yourRatingHeading: "Senin Puanın",
      notRatedYet: "Henüz puan vermedin",
      lockedNeedsStatus: "Puan verebilmek için önce İzleme Durumu seç.",
      lockedNeedsWatchedOrDropped:
        "Puan vermek için filmi izlediğini veya yarım bıraktığını işaretle.",
      ratingPreservedSuffix: " Mevcut puanın korunuyor.",
      selectRatingLabel: "Puan Ver",
      selectRatingPlaceholder: "Puan seç",
      deleteRating: "Puanı Sil",
      watchStatusHeading: "İzleme Durumu",
      selectStatusLabel: "Durum Seç",
      selectStatusPlaceholder: "Durum seçilmedi",
      removeStatus: "Durumu Kaldır",
    },
    personActions: {
      addActor: "Favori Oyunculara Ekle",
      removeActor: "Favori Oyunculardan Çıkar",
      addDirector: "Favori Yönetmenlere Ekle",
      removeDirector: "Favori Yönetmenlerden Çıkar",
      addStudio: "Favori Stüdyolara Ekle",
      removeStudio: "Favori Stüdyolardan Çıkar",
      actorLimitMessage: "En fazla 50 favori oyuncu ekleyebilirsin.",
      directorLimitMessage: "En fazla 30 favori yönetmen ekleyebilirsin.",
      studioLimitMessage: "En fazla 30 favori stüdyo ekleyebilirsin.",
      noLogo: "Logo yok",
      knownForPrefix: "Bilinen:",
    },
  },
  en: {
    common: {
      previous: "← Previous",
      next: "Next →",
      page: "Page",
      total: "Total",
      results: "results",
      movies: "movies",
      exploreMovies: "Explore Movies",
      searchMoviesCta: "Search Movies",
      retry: "Try Again",
      noPoster: "Poster not found",
      noProfileImage: "Image not found",
      noActorImage: "Actor image not found",
      noDate: "No date",
      loadErrorTitle: "Movies could not be loaded",
      loadErrorDescription: "Refresh the page and try again.",
      clearFilters: "Clear Filters",
      average: "Average",
      examplePrefix: "e.g.",
    },
    navbar: {
      movies: "Movies",
      search: "Search",
      whatToWatch: "What to Watch",
      collections: "Collections",
      favorites: "Favorites",
      watchlist: "Watchlist",
      activity: "Activity",
      ratings: "Ratings",
      profile: "Profile",
      about: "About",
      settings: "Settings",
      openMenu: "Open menu",
      closeMenu: "Close menu",
    },
    home: {
      eyebrow: "Movie Discovery App",
      title:
        "Discover movies, explore details, and build your own watchlist.",
      subtitle: "Browse movie categories, pick a genre, and sort the results your way.",
      browseEyebrow: "Browse",
      filteredMoviesTitle: "Filtered Movies",
      categoryMoviesSuffix: "Movies",
      activeFilters: "Active Filters",
      genreLabel: "Genre:",
      sortLabel: "Sort:",
      sortFieldLabel: "Sort",
      allGenres: "All Genres",
      noResultsTitle: "No movies found with these filters",
      noResultsDescription: "Try a different genre or sort option.",
      filterCta: "Filter",
    },
    categories: {
      popular: "Popular",
      "top-rated": "Top Rated",
      "now-playing": "Now Playing",
      upcoming: "Upcoming",
    },
    sorts: {
      "popularity.desc": "Most Popular",
      "vote_average.desc": "Highest Rated",
      "primary_release_date.desc": "Newest",
    },
    search: {
      eyebrow: "Movie Search",
      title: "Search Movies",
      subtitle: "Type the name of the movie you want to search for.",
      inputLabel: "Movie name",
      inputPlaceholder: "e.g. Interstellar",
      submit: "Search",
      promptTitle: "Start searching for a movie",
      promptDescription:
        'Type a movie name in the search box and press "Search".',
      resultsForSuffix: "search results",
      noResultsTitle: "No movies found",
      noResultsDescription: "Try searching with a different movie name.",
    },
    movieDetail: {
      eyebrow: "Movie Details",
      summaryHeading: "Overview",
      noOverview: "No description available for this movie.",
      creativeTeamHeading: "Creative Team",
      directorLabel: "Director",
      writerLabel: "Writer",
      cinematographerLabel: "Cinematographer",
      musicLabel: "Music",
      studiosHeading: "Studios",
      trailerEyebrow: "Official Video",
      trailerHeading: "Trailer",
      castEyebrow: "Cast",
      castHeading: "Cast",
      seriesHeading: "Series Movies",
      seriesDescription: "Other entries in the collection this movie belongs to.",
      recommendedEyebrow: "You May Also Like",
      recommendedHeading: "Recommended",
      ratingPrefix: "Rating:",
      noRuntime: "Runtime unknown",
      hourUnit: "hr",
      minuteUnit: "min",
      whereToWatchHeading: "Where to Watch",
    },
    personDetail: {
      eyebrow: "Person Details",
      biographyHeading: "Biography",
      noBiography: "No biography available for this person.",
      noBirthDate: "No birth date",
      noBirthPlace: "No birthplace",
      filmographyEyebrow: "Filmography",
      filmographyHeading: "Filmography",
      noMoviesTitle: "No movies found",
      noMoviesDescription: "No filmography information available for this person.",
      noCharacterInfo: "No character information",
    },
    collections: {
      eyebrow: "CiNeA Collections",
      title: "Collections",
      subtitle: "Pick a themed collection that matches your mood.",
      cardEyebrow: "Collection",
      openCollectionCta: "Open Collection",
      detailEyebrow: "CiNeA Collection",
      noResultsTitle: "No movies found in this collection",
      noResultsDescription: "Please try again later.",
    },
    whatToWatch: {
      eyebrow: "What Should I Watch Tonight?",
      title: "What to Watch",
      subtitle:
        "Let's recommend a movie based on your mood, time, and company.",
      promptTitle: "Choose your preferences and we'll recommend a movie",
      promptDescription:
        'Fill out the form above and press "Get Recommendations".',
      moodLabel: "Mood",
      runtimeLabel: "Runtime",
      intensityLabel: "Intensity",
      companyLabel: "Watching With",
      discoveryLabel: "Discovery Preference",
      genreLabel: "Genre",
      genreAnyOption: "Any genre",
      submit: "Get Recommendations",
      resultsEyebrow: "Picked For You",
      personalizationLow: "Rate more movies to improve personalized ranking.",
      personalizationApplied:
        "Results were filtered by your choices and ranked by your taste profile.",
      noResultsTitle: "No movies found with these preferences",
      noResultsDescription:
        'Try broader preferences — e.g. set runtime to "Any" or remove the genre.',
      resetFormCta: "Reset Form",
    },
    moods: {
      fun: "Fun",
      exciting: "Exciting",
      emotional: "Emotional",
      dark: "Dark",
      cozy: "Cozy",
      thoughtful: "Thought-provoking",
    },
    runtimes: {
      short: "Under 90 minutes",
      medium: "90-120 minutes",
      long: "Over 120 minutes",
      any: "Any",
    },
    intensities: {
      light: "Light",
      balanced: "Balanced",
      intense: "Intense",
    },
    companies: {
      alone: "Alone",
      friends: "With friends",
      family: "With family",
      partner: "With partner",
    },
    discoveries: {
      safe: "Safe pick",
      balanced: "Balanced",
      different: "Something different",
    },
    forYou: {
      eyebrow: "Personal Recommendations",
      title: "For You",
      subtitle:
        "Recommendations are calculated from your ratings, watch statuses, and explicit preferences.",
      privacyNote:
        "Your taste profile is calculated from local data on this device. When looking for recommendation candidates, only a few short filters (e.g. your top genre/person ids) are sent to the server; your ratings, watch history, or identity are never stored.",
      errorTitle: "Recommendations could not be loaded",
      errorDescription: "There was a problem fetching data from TMDB.",
      emptyProfileTitle: "Not enough data yet to generate personal recommendations.",
      emptyProfileDescription:
        "Rate a few movies, mark a watch status, or add a favorite actor/director/studio — recommendations will start appearing here.",
      addPreferencesCta: "Add Your Preferences",
      whatToWatchCta: "What to Watch?",
      lowConfidenceNote:
        "The more movies you rate, the better recommendations fit you.",
      noRecommendationsTitle: "No recommendations available right now",
      noRecommendationsDescription:
        "Recommendations will appear here as you rate more movies or add preferences.",
      genericExplanation: "General quality and discovery pick",
    },
    confidence: {
      low: "Low Confidence",
      medium: "Medium Confidence",
      high: "High Confidence",
    },
    tasteProfile: {
      heading: "Your Taste Profile",
      descriptionPrefix:
        "This profile is built from the ratings and watch statuses you've given.",
      confidenceLow:
        "There's not much data yet. Rate more movies to make your profile more reliable.",
      confidenceMedium:
        "You have a reasonable number of rated movies; the profile reflects your general tendency. Rate more movies to make it more reliable.",
      confidenceHigh:
        "You have a rich rating history; the profile is quite reliable.",
      noDataText:
        "Not enough data yet. Once you rate a few movies or mark a watch status, your taste profile will start forming here.",
      favoriteGenresHeading: "Genres You Love",
      movieDnaHeading: "Your Movie DNA Trends",
      preferredRuntimeHeading: "Your Preferred Runtime",
      erasHeading: "Eras",
      languagesHeading: "Languages",
      noTrendText: "No clear trend yet.",
      footerNote:
        "This profile is calculated from local data on this device and isn't saved to an account or the cloud yet. Favorite people/studios are your explicit preferences; genre and Movie DNA trends are estimates derived from your ratings.",
      runtimeNotDetermined: "Not yet determined",
    },
    favorites: {
      eyebrow: "Your Collection",
      title: "Favorites",
      subtitle: "Movies you've saved as favorites are shown here.",
      emptyTitle: "No favorite movies yet",
      emptyDescription:
        "You can add movies to your favorites from the movie detail page.",
    },
    watchlist: {
      eyebrow: "Watch Later",
      title: "Watchlist",
      subtitle: "Movies you've saved to watch later are shown here.",
      emptyTitle: "Your watchlist is currently empty",
      emptyDescription:
        "You can add movies to your watchlist from the movie detail page.",
    },
    ratings: {
      eyebrow: "Personal Statistics",
      title: "Ratings",
      subtitle:
        "You can see the movies you've rated and your personal statistics here.",
      emptyTitle: "You haven't rated any movies yet",
      emptyDescription: "You can rate a movie from its detail page.",
      totalRated: "Total Rated Movies",
      averageRating: "Average Rating",
      distributionHeading: "Rating Distribution",
      ratedMoviesHeading: "Movies You've Rated",
      movieInfoErrorTitle: "Movie information could not be loaded",
      yourRatingPrefix: "Your Rating:",
    },
    profile: {
      eyebrow: "Local Profile",
      title: "Profile",
      subtitle:
        "Your personal summary based on favorites, watchlist, and ratings is here.",
      favoriteMovies: "Favorite Movies",
      watchlistMovies: "Watchlist Movies",
      ratedMovies: "Rated Movies",
      highestRating: "Highest Rating",
      lowestRating: "Lowest Rating",
      favoriteActorsSuffix: "favorite actors",
      favoriteDirectorsSuffix: "favorite directors",
      favoriteStudiosSuffix: "favorite studios",
      personalRecommendationsCta: "Personal Recommendations →",
      editPreferencesCta: "Edit Your Preferences →",
      settingsCta: "Settings →",
      ratingTrendHeading: "Your Rating Trend",
      tasteSummaryHigh: "You're selective but rate high when you love something.",
      tasteSummaryMedium: "You have a balanced rating tendency.",
      tasteSummaryLow: "You evaluate movies more critically.",
      emptyTasteTitle: "No data yet for a taste summary",
      emptyTasteDescription:
        "Once you start rating movies, you'll see your genre preferences and favorite movies here.",
      goToRatingsCta: "Go to Ratings Page",
      topGenresHeading: "Your Most Rated Genres",
      topGenresEmptyText: "Not enough data for genre statistics.",
      favoriteMoviesHeading: "Your Favorite Movies",
      favoriteMoviesEmptyText: "No movies to show.",
    },
    activity: {
      eyebrow: "Watch Activity",
      title: "Activity",
      subtitle:
        "Track movies you've watched, are watching, and plan to watch here.",
      emptyTitle: "No watch activity yet",
      emptyDescription: "You can mark a watch status from a movie detail page.",
      statWatched: "Watched",
      statWatching: "Currently Watching",
      statDropped: "Dropped",
      statPlanToWatch: "Plan to Watch",
    },
    preferences: {
      eyebrow: "Preferences",
      title: "Preferences",
      subtitle:
        "Choose your favorite actors, directors, and production studios here. These preferences are currently stored only on this device; they aren't used in personal recommendations or CiNeA Match yet.",
      section1Heading: "1. Favorite Actors",
      section2Heading: "2. Favorite Directors",
      section3Heading: "3. Favorite Studios",
      actorSearchLabel: "Search actor",
      directorSearchLabel: "Search director",
      companySearchLabel: "Search studio",
      searchButton: "Search",
      directorNote:
        'TMDB person search may not show the role reliably; results are prioritized by the "Directing" department, but you make the final call by checking the department label.',
      actorPromptEmpty: "Start searching for an actor.",
      directorPromptEmpty: "Start searching for a director.",
      companyPromptEmpty: "Start searching for a studio.",
      existingFavoritesHeading: "Your Current Favorites",
      noFavoriteActors: "You haven't added any favorite actors yet.",
      noFavoriteDirectors: "You haven't added any favorite directors yet.",
      noFavoriteStudios: "You haven't added any favorite studios yet.",
    },
    settings: {
      title: "Settings",
      description:
        "Manage your language, appearance, and region preferences here.",
      languageSection: "Language",
      themeSection: "Appearance",
      regionSection: "Region",
      localDataTitle: "Local Data",
      localDataNote: "Your settings are stored on this device.",
      savedStatus: "Setting saved",
      resetButton: "Reset to Defaults",
      resetStatus: "Reset to defaults",
      isoCodeLabel: "Code",
      summaryHeading: "Summary",
    },
    theme: {
      system: "System",
      dark: "Dark",
      light: "Light",
    },
    language: {
      tr: "Türkçe",
      en: "English",
    },
    about: {
      eyebrow: "About the Project",
      paragraph1:
        "CineScope is a movie discovery app built with Next.js and TypeScript.",
      paragraph2:
        "Movie data and images are sourced from The Movie Database API.",
      paragraph3:
        "The project applies concepts such as API integration, dynamic routing, Server Components, responsive design, and user lists.",
    },
    notFound: {
      eyebrow: "404",
      title: "Page not found",
      description:
        "The movie, person, or page you're looking for doesn't exist or may have been removed.",
      goHome: "Back to Home",
    },
    errorPage: {
      eyebrow: "An error occurred",
      title: "Movies cannot be loaded right now",
      description:
        "You can check your internet connection or TMDB API settings and try again.",
    },
    movieActions: {
      addFavorite: "Add to Favorites",
      removeFavorite: "Remove from Favorites",
      addWatchlist: "Add to Watchlist",
      removeWatchlist: "Remove from Watchlist",
    },
    ratingStatus: {
      watched: "Watched",
      watching: "Watching",
      dropped: "Dropped",
      planToWatch: "Plan to Watch",
      yourRatingHeading: "Your Rating",
      notRatedYet: "You haven't rated yet",
      lockedNeedsStatus: "Choose a watch status before rating.",
      lockedNeedsWatchedOrDropped:
        "Mark the movie as watched or dropped to rate it.",
      ratingPreservedSuffix: " Your existing rating is kept.",
      selectRatingLabel: "Rate",
      selectRatingPlaceholder: "Select rating",
      deleteRating: "Delete Rating",
      watchStatusHeading: "Watch Status",
      selectStatusLabel: "Select Status",
      selectStatusPlaceholder: "No status selected",
      removeStatus: "Remove Status",
    },
    personActions: {
      addActor: "Add to Favorite Actors",
      removeActor: "Remove from Favorite Actors",
      addDirector: "Add to Favorite Directors",
      removeDirector: "Remove from Favorite Directors",
      addStudio: "Add to Favorite Studios",
      removeStudio: "Remove from Favorite Studios",
      actorLimitMessage: "You can add up to 50 favorite actors.",
      directorLimitMessage: "You can add up to 30 favorite directors.",
      studioLimitMessage: "You can add up to 30 favorite studios.",
      noLogo: "No logo",
      knownForPrefix: "Known for:",
    },
  },
} as const;

type Translations = typeof translations.tr;
type TranslationSection = keyof Translations;

// Tip güvenli küçük helper: section+key ikilisi, çeviri anahtarlarının
// component içine dize olarak dağılmasını önler ve geçersiz bir anahtar
// derleme zamanında hata verir. Yalnızca "tr" ve "en" desteklendiği ve
// ikisi de aynı anahtar kümesine sahip olduğu için eksik çeviri runtime'da
// crash üretmez.
export function t<
  Section extends TranslationSection,
  Key extends keyof Translations[Section],
>(language: AppLanguage, section: Section, key: Key): Translations[Section][Key] {
  // tr/en nesneleri yapısal olarak aynı şekle (Translations) sahip; union
  // indeksleme TypeScript'i tatmin etmediği için burada tek noktadan
  // doğrulanmış bir cast yapılıyor.
  const languageTranslations = translations[language] as Translations;

  return languageTranslations[section][key];
}

// ─── Bileşik/enterpolasyonlu metinler ───────────────────────────────────
//
// Kelime sırası dile göre değiştiği için (ör. tırnaklı sorgu TR'de önce,
// EN'de cümle içinde) bu birkaç cümle t() yerine küçük saf fonksiyonlarla
// üretilir. Aynı mantık iki yerde kopyalanmasın diye tek noktada tutulur.

export function buildPageSummary(
  language: AppLanguage,
  currentPage: number,
  totalPages: number
): string {
  return `${t(language, "common", "page")} ${currentPage} / ${totalPages}`;
}

export function buildTotalResultsSummary(
  language: AppLanguage,
  count: number,
  unit: "results" | "movies" = "results"
): string {
  const formattedCount = count.toLocaleString(
    language === "tr" ? "tr-TR" : "en-US"
  );
  const unitLabel = t(language, "common", unit);

  return `${t(language, "common", "total")} ${formattedCount} ${unitLabel}`;
}

export function buildSearchResultsForHeading(
  language: AppLanguage,
  query: string
): string {
  return `"${query}" ${t(language, "search", "resultsForSuffix")}`;
}

export function buildNoResultsForMessage(
  language: AppLanguage,
  query: string
): string {
  return language === "tr"
    ? `"${query}" için sonuç bulunamadı.`
    : `No results found for "${query}".`;
}

export function buildFavoriteCountHeading(
  language: AppLanguage,
  kind: "actors" | "directors" | "studios",
  count: number,
  limit: number
): string {
  const labelsTr: Record<typeof kind, string> = {
    actors: "Favori Oyuncuların",
    directors: "Favori Yönetmenlerin",
    studios: "Favori Stüdyoların",
  };
  const labelsEn: Record<typeof kind, string> = {
    actors: "Your Favorite Actors",
    directors: "Your Favorite Directors",
    studios: "Your Favorite Studios",
  };

  const label = language === "tr" ? labelsTr[kind] : labelsEn[kind];

  return `${label} (${count}/${limit})`;
}

export function buildRatingDistributionAriaLabel(
  language: AppLanguage,
  bucketLabel: string,
  count: number
): string {
  return language === "tr"
    ? `${bucketLabel} puan aralığında ${count} film`
    : `${count} movies in the ${bucketLabel} rating range`;
}

export function buildRemoveFromFavoritesAriaLabel(
  language: AppLanguage,
  name: string
): string {
  return language === "tr"
    ? `${name} favorilerden çıkar`
    : `Remove ${name} from favorites`;
}

export function buildRuntimeLabel(
  language: AppLanguage,
  runtimeMinutes: number | null
): string {
  if (!runtimeMinutes) {
    return t(language, "movieDetail", "noRuntime");
  }

  const hours = Math.floor(runtimeMinutes / 60);
  const minutes = runtimeMinutes % 60;
  const hourUnit = t(language, "movieDetail", "hourUnit");
  const minuteUnit = t(language, "movieDetail", "minuteUnit");

  if (hours === 0) {
    return `${minutes} ${minuteUnit}`;
  }

  return `${hours} ${hourUnit} ${minutes} ${minuteUnit}`;
}

export function buildGenreCountSummary(
  language: AppLanguage,
  count: number,
  averageScore: number
): string {
  const movieWord = t(language, "common", "movies");
  const averageWord = t(language, "common", "average");

  return `${count} ${movieWord} · ${averageWord} ${averageScore.toFixed(1)} / 10`;
}

type RuntimePreferenceInput = {
  preferredMin: number | null;
  preferredMax: number | null;
  averageRuntime: number | null;
};

// TasteProfileSection'daki "Tercih Ettiğin Süre" cümlesi — sayı/aralık
// mantığı dilden bağımsız aynı, yalnızca birim/edat kelimeleri değişiyor.
export function buildRuntimePreferenceLabel(
  language: AppLanguage,
  runtimePreference: RuntimePreferenceInput
): string {
  const { preferredMin, preferredMax, averageRuntime } = runtimePreference;

  if (preferredMin === null) {
    if (averageRuntime === null) {
      return t(language, "tasteProfile", "runtimeNotDetermined");
    }

    return language === "tr"
      ? `Ortalama ${averageRuntime} dakika`
      : `Average ${averageRuntime} minutes`;
  }

  const rangeLabel =
    preferredMax === null
      ? language === "tr"
        ? `${preferredMin}+ dakika (uzun filmler)`
        : `${preferredMin}+ minutes (long movies)`
      : preferredMin === 0
        ? language === "tr"
          ? `${preferredMax} dakika ve altı (kısa filmler)`
          : `${preferredMax} minutes or less (short movies)`
        : language === "tr"
          ? `${preferredMin}–${preferredMax} dakika (orta uzunlukta filmler)`
          : `${preferredMin}–${preferredMax} minutes (medium-length movies)`;

  if (averageRuntime === null) {
    return rangeLabel;
  }

  return language === "tr"
    ? `${rangeLabel} · ortalama ${averageRuntime} dakika`
    : `${rangeLabel} · average ${averageRuntime} minutes`;
}

const MOOD_OPTION_VALUES = [
  "fun",
  "exciting",
  "emotional",
  "dark",
  "cozy",
  "thoughtful",
] as const;

const RUNTIME_OPTION_VALUES = ["short", "medium", "long", "any"] as const;

const INTENSITY_OPTION_VALUES = ["light", "balanced", "intense"] as const;

const COMPANY_OPTION_VALUES = [
  "alone",
  "friends",
  "family",
  "partner",
] as const;

const DISCOVERY_OPTION_VALUES = ["safe", "balanced", "different"] as const;

export function getMoodOptions(language: AppLanguage) {
  return MOOD_OPTION_VALUES.map((value) => ({
    value,
    label: t(language, "moods", value),
  }));
}

export function getRuntimeOptions(language: AppLanguage) {
  return RUNTIME_OPTION_VALUES.map((value) => ({
    value,
    label: t(language, "runtimes", value),
  }));
}

export function getIntensityOptions(language: AppLanguage) {
  return INTENSITY_OPTION_VALUES.map((value) => ({
    value,
    label: t(language, "intensities", value),
  }));
}

export function getCompanyOptions(language: AppLanguage) {
  return COMPANY_OPTION_VALUES.map((value) => ({
    value,
    label: t(language, "companies", value),
  }));
}

export function getDiscoveryOptions(language: AppLanguage) {
  return DISCOVERY_OPTION_VALUES.map((value) => ({
    value,
    label: t(language, "discoveries", value),
  }));
}
