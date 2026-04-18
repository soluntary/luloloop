"use client"

import { FaPlus, FaCheck } from "react-icons/fa"

// Generate a consistent color for a game based on its title
const getBookColor = (title: string, index: number): string => {
  const colors = [
    "from-red-400 to-red-500",
    "from-orange-400 to-orange-500",
    "from-yellow-400 to-yellow-500",
    "from-green-400 to-green-500",
    "from-teal-400 to-teal-500",
    "from-blue-400 to-blue-500",
    "from-indigo-400 to-indigo-500",
    "from-purple-400 to-purple-500",
    "from-pink-400 to-pink-500",
    "from-rose-400 to-rose-500",
    "from-cyan-400 to-cyan-500",
    "from-emerald-400 to-emerald-500",
  ]
  
  // Use title hash for consistent color
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash + index) % colors.length]
}

interface Game {
  id: string
  title: string
  image?: string
  tracking_info?: {
    status?: string
  }
}

interface BookshelfDisplayProps {
  games: Game[]
  isSelectionMode: boolean
  selectedGames: Set<string>
  onGameClick: (game: Game) => void
  onToggleSelection: (gameId: string) => void
  onAddGameClick: () => void
}

export function BookshelfDisplay({
  games,
  isSelectionMode,
  selectedGames,
  onGameClick,
  onToggleSelection,
  onAddGameClick,
}: BookshelfDisplayProps) {
  const BOOKS_PER_SHELF = 10
  
  // Split games into shelves
  const shelves: Game[][] = []
  for (let i = 0; i < games.length; i += BOOKS_PER_SHELF) {
    shelves.push(games.slice(i, i + BOOKS_PER_SHELF))
  }
  
  // Add empty shelf if no games
  if (shelves.length === 0) {
    shelves.push([])
  }

  return (
    <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-2xl p-4 shadow-inner">
      {/* Wooden frame */}
      <div className="absolute inset-0 rounded-2xl border-[12px] border-amber-700 pointer-events-none" 
           style={{ 
             boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
             background: 'linear-gradient(135deg, #92400e 0%, #b45309 50%, #92400e 100%)',
             borderRadius: '16px'
           }}>
        {/* Wood grain texture overlay */}
        <div className="absolute inset-0 opacity-20" 
             style={{
               backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)'
             }}
        />
      </div>
      
      {/* Inner shelf area */}
      <div className="relative bg-gradient-to-b from-amber-50 to-amber-100 rounded-lg overflow-hidden" 
           style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.15)' }}>
        
        {/* Shelves */}
        <div className="space-y-0">
          {shelves.map((shelfGames, shelfIndex) => (
            <div key={shelfIndex} className="relative">
              {/* Books on shelf */}
              <div className="flex items-end justify-start gap-1 px-4 pt-4 pb-0 min-h-[140px]">
                {/* Add book button - only on first shelf */}
                {shelfIndex === 0 && (
                  <div
                    className="flex-shrink-0 cursor-pointer transform hover:scale-105 hover:-translate-y-1 transition-all duration-200"
                    onClick={onAddGameClick}
                  >
                    <div className="w-8 h-[120px] bg-gradient-to-b from-teal-200 to-teal-300 rounded-t-sm rounded-b-sm shadow-md border border-teal-400 border-dashed flex items-center justify-center relative"
                         style={{ boxShadow: '2px 0 4px rgba(0,0,0,0.2)' }}>
                      <FaPlus className="w-4 h-4 text-teal-600 rotate-0" />
                    </div>
                  </div>
                )}
                
                {/* Game books */}
                {shelfGames.map((game, bookIndex) => (
                  <div
                    key={game.id}
                    className="flex-shrink-0 cursor-pointer transform hover:scale-105 hover:-translate-y-2 hover:rotate-[-2deg] transition-all duration-200 relative group"
                    onClick={() => isSelectionMode ? onToggleSelection(game.id) : onGameClick(game)}
                  >
                    {/* Selection checkbox */}
                    {isSelectionMode && (
                      <div className="absolute -top-1 -right-1 z-20">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-md ${
                            selectedGames.has(game.id)
                              ? "bg-teal-500 border-teal-500"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          {selectedGames.has(game.id) && (
                            <FaCheck className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Availability indicator */}
                    {!isSelectionMode && (
                      <div className="absolute top-1 right-0 z-10">
                        <div
                          className={`w-2 h-2 rounded-full shadow-sm ${
                            !game.tracking_info?.status || game.tracking_info.status === "available"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                          title={
                            !game.tracking_info?.status || game.tracking_info.status === "available"
                              ? "Verfügbar"
                              : game.tracking_info.status === "rented"
                                ? "Vermietet / Verliehen"
                                : "Getauscht"
                          }
                        />
                      </div>
                    )}
                    
                    {/* Book spine */}
                    <div 
                      className={`w-8 md:w-10 h-[120px] bg-gradient-to-b ${getBookColor(game.title, bookIndex)} rounded-t-sm rounded-b-sm shadow-md relative overflow-hidden ${
                        selectedGames.has(game.id) ? "ring-2 ring-teal-500" : ""
                      }`}
                      style={{ 
                        boxShadow: '2px 0 4px rgba(0,0,0,0.2), inset -2px 0 4px rgba(255,255,255,0.3)',
                      }}
                    >
                      {/* Spine highlight */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30" />
                      
                      {/* Book title - vertical */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p 
                          className="text-white text-[10px] md:text-xs font-bold whitespace-nowrap transform -rotate-90 origin-center drop-shadow-md"
                          style={{ 
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                            maxWidth: '100px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {game.title.length > 15 ? game.title.substring(0, 15) + '...' : game.title}
                        </p>
                      </div>
                      
                      {/* Top and bottom book details */}
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-white/40 rounded-full" />
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-white/40 rounded-full" />
                    </div>
                    
                    {/* Hover tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                      {game.title}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Shelf board */}
              <div className="relative h-4 mx-2">
                <div 
                  className="absolute inset-0 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-800 rounded-sm"
                  style={{ 
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                  }}
                />
                {/* Shelf edge highlight */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-amber-500 to-transparent rounded-t-sm" />
              </div>
            </div>
          ))}
          
          {/* Empty shelves for visual appeal */}
          {shelves.length < 3 && Array.from({ length: 3 - shelves.length }).map((_, index) => (
            <div key={`empty-${index}`} className="relative">
              <div className="flex items-end justify-start gap-1 px-4 pt-4 pb-0 min-h-[140px]" />
              <div className="relative h-4 mx-2">
                <div 
                  className="absolute inset-0 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-800 rounded-sm"
                  style={{ 
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                  }}
                />
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-amber-500 to-transparent rounded-t-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
