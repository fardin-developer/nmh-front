import React, { useEffect, useMemo, useRef, useState } from 'react'
import Slider from 'react-slick'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import BottomMenu from '../components/BottomMenu'
import { getPublicBanners } from '../api/apiService'

const SEARCH_ALIAS_GROUPS = [
  ['mlbb', 'mobile legends', 'mobile legend', 'mobilelegends', 'bang bang'],
  ['pubg', 'pubg global', 'playerunknown battlegrounds'],
  ['coc', 'clash of clans'],
]

const normalizeSearchText = (value) => value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

const expandSearchAliases = (text) => {
  const normalized = normalizeSearchText(text)
  if (!normalized) {
    return []
  }

  const expanded = new Set([normalized, ...normalized.split(' ')])
  SEARCH_ALIAS_GROUPS.forEach((group) => {
    const normalizedGroup = group.map((item) => normalizeSearchText(item))
    if (normalizedGroup.some((alias) => normalized.includes(alias))) {
      normalizedGroup.forEach((alias) => {
        expanded.add(alias)
        alias.split(' ').forEach((token) => expanded.add(token))
      })
    }
  })

  return Array.from(expanded).filter(Boolean)
}

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const infoData = useSelector((state) => state.infoData)
  const [primaryBanners, setPrimaryBanners] = useState([])
  const [gameSearch, setGameSearch] = useState('')
  const gamesSectionRef = useRef(null)
  const searchInputRef = useRef(null)

  const normalizedSearch = gameSearch.trim().toLowerCase()
  const filteredGames = useMemo(() => {
    const availableGames = infoData.availableGames || []

    if (!normalizedSearch) {
      return availableGames
    }

    const terms = expandSearchAliases(normalizedSearch)

    return availableGames
      .filter((game) => {
        const searchableText = `${game?.name || ''} ${game?.code || ''}`
        const expandedSearchableText = expandSearchAliases(searchableText).join(' ')
        return terms.every((term) => expandedSearchableText.includes(term))
      })
      .sort((a, b) => {
        const aName = (a?.name || '').toLowerCase()
        const bName = (b?.name || '').toLowerCase()
        const aStarts = aName.startsWith(normalizedSearch)
        const bStarts = bName.startsWith(normalizedSearch)

        if (aStarts === bStarts) {
          return aName.localeCompare(bName)
        }

        return aStarts ? -1 : 1
      })
  }, [infoData.availableGames, normalizedSearch])

  const focusGamesSearchInput = () => {
    setTimeout(() => {
      const stickyHeader = document.querySelector('header.sticky-top')
      const headerHeight = stickyHeader?.offsetHeight || 110
      const topOffset = gamesSectionRef.current.getBoundingClientRect().top + window.scrollY - headerHeight - 12
      window.scrollTo({ top: Math.max(topOffset, 0), behavior: 'smooth' })
    }, 0)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 250)
  }

  useEffect(() => {
    document.title = 'NMH Gaming - Home'
  }, [])

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await getPublicBanners()
        if (data.success && Array.isArray(data.data)) {
          const sorted = data.data.slice().sort((a, b) => a.priority - b.priority)
          setPrimaryBanners(sorted.filter(b => b.type === 'primary banner'))
        }
      } catch (err) {
        console.error('Failed to fetch banners:', err)
      }
    }
    fetchBanners()
  }, [])

  useEffect(() => {
    const shouldFocusGamesSearch = new URLSearchParams(location.search).get('focusGamesSearch') === '1'

    if (shouldFocusGamesSearch) {
      focusGamesSearchInput()
      navigate('/', { replace: true })
    }
  }, [location.search, navigate])

  useEffect(() => {
    const handleBottomSearchPress = () => {
      focusGamesSearchInput()
    }

    window.addEventListener('dos:focus-games-search', handleBottomSearchPress)
    return () => window.removeEventListener('dos:focus-games-search', handleBottomSearchPress)
  }, [])

  const settings = {
    dots: true,
    centerMode: true,
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 2000,
    arrows: false,
    slidesToShow: 1,
    swipe: true,
    swipeToSlide: true,
    centerPadding: '0px',
    slidesToScroll: 1,
    padding: '0',
    slideMargin: '0',
    focusOnSelect: true,
    responsive: [
      {
        breakpoint: 991,
        settings: {
          slidesToShow: 1,
          centerPadding: '40px',
          slidesToScroll: 1,
          initialSlide: 1,
        },
      },
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 1,
          centerPadding: '0px',
          slidesToScroll: 1,
          initialSlide: 1,
        },
      },
      {
        breakpoint: 680,
        settings: {
          slidesToShow: 1,
          centerPadding: '0px',
          slidesToScroll: 1,
        },
      },
    ],
  }


  return (
    <section className='home-page home-app-page'>
      <div className='home-hero-band home-app-hero'>
        <div className='container'>
          <div className='home-app-topbar'>

          </div>

          <div className='center-slider home-hero-slider home-app-slider'>
            {primaryBanners.length ? (
              <Slider {...settings}>
                {primaryBanners.map((banner, index) => (
                  <div
                    key={banner._id || index}
                    onClick={() => banner.url && window.open(banner.url, '_blank', 'noopener,noreferrer')}
                    style={{ cursor: banner.url ? 'pointer' : 'default' }}
                  >
                    <img src={banner.image} alt={banner.title || 'banner'} />
                  </div>
                ))}
              </Slider>
            ) : (
              <div className='home-banner-fallback'>
                <span>NMH Gaming</span>
              </div>
            )}
          </div>

          <div className='home-quick-actions'>
            <button type='button' onClick={() => navigate('/reports?type=purchase')}>
              <svg className='icon'>
                <use href='#icon_order'></use>
              </svg>
              <span>Orders</span>
            </button>
            <button type='button' onClick={() => navigate('/my-wallet')}>
              <svg className='icon'>
                <use href='#icon_wallet'></use>
              </svg>
              <span>Wallet</span>
            </button>
            <button type='button' onClick={() => navigate('/support')}>
              <svg className='icon'>
                <use href='#icon_chat'></use>
              </svg>
              <span>Support</span>
            </button>
          </div>
        </div>
      </div>

      <div className='container home-games-section home-app-games py-md-4 pb-3' ref={gamesSectionRef}>
        <div className='row'>
          <div className='col-12'>
            <div className='home-games-search home-app-search'>
              <input
                ref={searchInputRef}
                type='search'
                className='form-control games-search-input'
                placeholder='Search games...'
                value={gameSearch}
                onChange={(event) => setGameSearch(event.target.value)}
                aria-label='Search games'
              />
              {gameSearch && (
                <button type='button' className='games-search-clear' onClick={() => setGameSearch('')} aria-label='Clear game search'>
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className='col-12 pb-2 pt-3'>
            <div className='home-section-heading d-flex align-items-center justify-content-between flex-wrap gap-2'>
              <div>
                <h2 className='populargame-heading mb-0'>Popular Games</h2>
              </div>
              <p className='games-result-count mb-0'>{filteredGames.length} available</p>
            </div>
          </div>
        </div>

        <div className='row row-cols-3 row-cols-lg-5 g-md-3 g-2 PopularGames home-app-grid'>
          {filteredGames.map((element, index) => {
            return (
              <React.Fragment key={element._id || index}>
                <div className='col'>
                  <div className='card' onClick={() => navigate('/game/' + element._id)}>
                    <div className='img-box'>
                      <img src={element.image} alt={element.name} />
                    </div>
                    <div className='card-body pb-0'>
                      <h5 className='card-title text-center'>{element.name}</h5>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )
          })}
          {!filteredGames.length && (
            <div className='col-12'>
              <div className='games-empty-state'>
                <h5>No game found for "{gameSearch.trim()}"</h5>
                <p>Try a shorter keyword or different spelling.</p>
                <button type='button' className='btn btn-primary rounded-pill px-4' onClick={() => setGameSearch('')}>
                  Reset Search
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* <BottomMenu /> */}
    </section>
  )
}
