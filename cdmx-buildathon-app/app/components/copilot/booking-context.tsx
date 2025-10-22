/**
 * BookingContext - Persistent Booking Details Panel
 *
 * Shows extracted booking information that:
 * 1. Stays visible throughout the conversation
 * 2. Updates as agent extracts information
 * 3. Can be manually edited/overridden by agent
 * 4. Serves as source of truth for MCP tool calls
 */

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { cn } from "~/lib/utils"
import {
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Edit2,
  Check,
  X,
  Sparkles,
} from "lucide-react"
import type { CustomerProfile } from "~/lib/agent/state"

interface BookingContextProps {
  profile: CustomerProfile
  onUpdate?: (updates: Partial<CustomerProfile>) => void
  isReadOnly?: boolean
}

export function BookingContext({
  profile,
  onUpdate,
  isReadOnly = false,
}: BookingContextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState(profile)

  const handleSave = () => {
    onUpdate?.(editedProfile)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  // Helper to check if a field has been extracted
  const hasValue = (value: any): boolean => {
    if (value === undefined || value === null) return false
    if (typeof value === "string") return value.trim().length > 0
    if (typeof value === "number") return value > 0
    if (typeof value === "object") return Object.keys(value).length > 0
    return false
  }

  // Helper to format date for display
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "Not set"
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } catch {
      return dateStr
    }
  }

  // Calculate nights if both dates present
  const calculateNights = (): number | null => {
    if (!profile.travelDates?.checkIn || !profile.travelDates?.checkOut) return null
    try {
      const checkIn = new Date(profile.travelDates.checkIn)
      const checkOut = new Date(profile.travelDates.checkOut)
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch {
      return null
    }
  }

  const nights = calculateNights()

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Booking Details</h3>
        </div>
        {!isReadOnly && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-7 text-xs"
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="h-7 text-xs text-green-700 hover:text-green-800 hover:bg-green-100"
            >
              <Check className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-7 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Guest Name */}
        {hasValue(profile.name) && (
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500">Guest</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.name || ""}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, name: e.target.value })
                  }
                  className="text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                />
              ) : (
                <div className="text-sm font-medium text-gray-900">{profile.name}</div>
              )}
            </div>
          </div>
        )}

        {/* Travel Dates */}
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500">Dates</div>
            {isEditing ? (
              <div className="space-y-1">
                <input
                  type="date"
                  value={editedProfile.travelDates?.checkIn || ""}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      travelDates: {
                        ...editedProfile.travelDates,
                        checkIn: e.target.value,
                      },
                    })
                  }
                  className="text-xs bg-white border border-gray-300 rounded px-2 py-1 w-full"
                />
                <input
                  type="date"
                  value={editedProfile.travelDates?.checkOut || ""}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      travelDates: {
                        ...editedProfile.travelDates,
                        checkOut: e.target.value,
                      },
                    })
                  }
                  className="text-xs bg-white border border-gray-300 rounded px-2 py-1 w-full"
                />
              </div>
            ) : hasValue(profile.travelDates?.checkIn) ||
              hasValue(profile.travelDates?.checkOut) ? (
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {formatDate(profile.travelDates?.checkIn)}
                  {" → "}
                  {formatDate(profile.travelDates?.checkOut)}
                </div>
                {nights && (
                  <div className="text-xs text-gray-600 mt-0.5">
                    {nights} {nights === 1 ? "night" : "nights"}
                  </div>
                )}
                {profile.travelDates?.flexible && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Flexible dates
                  </Badge>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">Not specified</div>
            )}
          </div>
        </div>

        {/* Party Size */}
        <div className="flex items-start gap-2">
          <Users className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500">Guests</div>
            {isEditing ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Adults</label>
                  <input
                    type="number"
                    min="1"
                    value={editedProfile.partySize?.adults || ""}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        partySize: {
                          ...editedProfile.partySize,
                          adults: parseInt(e.target.value) || undefined,
                        },
                      })
                    }
                    className="text-xs bg-white border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Children</label>
                  <input
                    type="number"
                    min="0"
                    value={editedProfile.partySize?.children || ""}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        partySize: {
                          ...editedProfile.partySize,
                          children: parseInt(e.target.value) || undefined,
                        },
                      })
                    }
                    className="text-xs bg-white border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </div>
              </div>
            ) : hasValue(profile.partySize?.adults) ? (
              <div className="text-sm font-medium text-gray-900">
                {profile.partySize?.adults} {profile.partySize?.adults === 1 ? "adult" : "adults"}
                {hasValue(profile.partySize?.children) &&
                  `, ${profile.partySize?.children} ${
                    profile.partySize?.children === 1 ? "child" : "children"
                  }`}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">Not specified</div>
            )}
          </div>
        </div>

        {/* Budget */}
        {(hasValue(profile.budget?.min) || hasValue(profile.budget?.max)) && (
          <div className="flex items-start gap-2">
            <DollarSign className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500">Budget</div>
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={editedProfile.budget?.min || ""}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        budget: {
                          ...editedProfile.budget,
                          min: parseInt(e.target.value) || undefined,
                        },
                      })
                    }
                    className="text-xs bg-white border border-gray-300 rounded px-2 py-1 w-full"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={editedProfile.budget?.max || ""}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        budget: {
                          ...editedProfile.budget,
                          max: parseInt(e.target.value) || undefined,
                        },
                      })
                    }
                    className="text-xs bg-white border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </div>
              ) : (
                <div className="text-sm font-medium text-gray-900">
                  {profile.budget?.currency || "$"}
                  {profile.budget?.min && profile.budget?.max
                    ? `${profile.budget.min.toLocaleString()} - ${profile.budget.max.toLocaleString()}`
                    : profile.budget?.max
                    ? `Up to ${profile.budget.max.toLocaleString()}`
                    : `From ${profile.budget?.min?.toLocaleString()}`}
                  {nights && profile.budget?.max && (
                    <span className="text-xs text-gray-500 ml-1">
                      (≈${Math.round((profile.budget.max || 0) / nights)}/night)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preferences */}
        {hasValue(profile.preferences) && profile.preferences && profile.preferences.length > 0 && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500">Preferences</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {profile.preferences.map((pref, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {pref}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Special Requests */}
        {hasValue(profile.specialRequests) &&
          profile.specialRequests &&
          profile.specialRequests.length > 0 && (
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">Special Requests</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.specialRequests.map((req, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-amber-50 text-amber-700">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Empty State */}
      {!hasValue(profile.name) &&
        !hasValue(profile.travelDates?.checkIn) &&
        !hasValue(profile.partySize?.adults) &&
        !hasValue(profile.budget?.min) &&
        !hasValue(profile.preferences) &&
        !hasValue(profile.specialRequests) && (
          <div className="text-center py-6">
            <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No booking details yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Information will appear as the conversation progresses
            </p>
          </div>
        )}
    </Card>
  )
}
