-- MapGenerator (ServerScript → ServerScriptService)
-- Listens for players joining, assigns plots, fetches step data, generates terrain.
-- Auto-refreshes every REFRESH_INTERVAL seconds so live step updates appear in-world.

local Players    = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local Workspace  = game:GetService("Workspace")

-- ── Config ────────────────────────────────────────────────────────────────────

local API_BASE         = "https://step-counter-mocha.vercel.app"
local REFRESH_INTERVAL = 30  -- seconds between auto-refreshes
local PLOT_NAMES       = {"Plot1", "Plot2", "Plot3", "Plot4"}

-- Roblox username → backend userId
-- Unlisted players fall back to their Roblox username directly,
-- so new testers work automatically without editing this table.
local USER_MAP = {
    ["YourRobloxUsername"]  = "marc",
    ["FriendUsername2"]     = "player2",
    ["FriendUsername3"]     = "player3",
    ["FriendUsername4"]     = "player4",
}

-- ── State ─────────────────────────────────────────────────────────────────────

local availablePlots = {}   -- queue of free plot names
local playerToPlot   = {}   -- [playerName] → plotName
local playerToUserId = {}   -- [playerName] → backendUserId

for _, name in ipairs(PLOT_NAMES) do
    table.insert(availablePlots, name)
end

-- ── Identity ──────────────────────────────────────────────────────────────────

local function getBackendUserId(player)
    return USER_MAP[player.Name] or player.Name
end

-- ── Plot pool ─────────────────────────────────────────────────────────────────

local function acquirePlot()
    if #availablePlots == 0 then return nil end
    return table.remove(availablePlots, 1)
end

local function releasePlot(plotName)
    table.insert(availablePlots, plotName)
end

-- ── World generation ──────────────────────────────────────────────────────────

local function clearPlot(plot)
    local gen = plot:FindFirstChild("Generated")
    if gen then gen:Destroy() end
end

local function makeTree(pos, parent)
    local trunk = Instance.new("Part")
    trunk.Size = Vector3.new(1, 4, 1)
    trunk.Position = pos
    trunk.Anchored = true
    trunk.BrickColor = BrickColor.new("Brown")
    trunk.Parent = parent

    local top = Instance.new("Part")
    top.Shape = Enum.PartType.Ball
    top.Size = Vector3.new(4, 4, 4)
    top.Position = pos + Vector3.new(0, 3, 0)
    top.Anchored = true
    top.BrickColor = BrickColor.new("Bright green")
    top.Parent = parent
end

local function addLabel(folder, plotBase, userId, steps)
    local anchor = Instance.new("Part")
    anchor.Name = "LabelAnchor"
    anchor.Size = Vector3.new(1, 1, 1)
    anchor.Transparency = 1
    anchor.Anchored = true
    anchor.CanCollide = false
    anchor.Position = plotBase + Vector3.new(0, 8, 0)
    anchor.Parent = folder

    local billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(0, 220, 0, 60)
    billboard.StudsOffset = Vector3.new(0, 3, 0)
    billboard.AlwaysOnTop = true
    billboard.Parent = anchor

    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 0.3
    label.TextScaled = true
    label.TextColor3 = Color3.new(1, 1, 1)
    label.Text = userId .. "\n" .. tostring(steps) .. " steps"
    label.Parent = billboard
end

local function populatePlot(plot, data)
    clearPlot(plot)

    local folder = Instance.new("Folder")
    folder.Name = "Generated"
    folder.Parent = plot

    local config = data.mapConfig or {}
    local trees  = config.trees or 0
    local tower  = config.tower or false

    for _ = 1, trees do
        local x = math.random(-15, 15)
        local z = math.random(-15, 15)
        makeTree(plot.Position + Vector3.new(x, 2, z), folder)
    end

    if tower then
        local towerPart = Instance.new("Part")
        towerPart.Size = Vector3.new(6, 20, 6)
        towerPart.Position = plot.Position + Vector3.new(0, 10, 0)
        towerPart.Anchored = true
        towerPart.BrickColor = BrickColor.new("Really black")
        towerPart.Parent = folder
    end

    addLabel(folder, plot.Position, data.userId or "?", data.steps or 0)
end

-- ── HTTP fetch ────────────────────────────────────────────────────────────────

local function fetchAndPopulate(userId, plotName)
    local plot = Workspace:FindFirstChild(plotName)
    if not plot then
        warn("Plot not found:", plotName)
        return
    end

    local url = API_BASE .. "/api/world?userId=" .. HttpService:UrlEncode(userId)

    local ok, response = pcall(HttpService.GetAsync, HttpService, url)
    if not ok then
        warn("HTTP failed for", userId, "-", response)
        return
    end

    local decodeOk, data = pcall(HttpService.JSONDecode, HttpService, response)
    if not decodeOk then
        warn("JSON decode failed:", data)
        return
    end

    print("Loaded:", data.userId, data.steps)
    populatePlot(plot, data)
end

-- ── Player lifecycle ──────────────────────────────────────────────────────────

local function onPlayerAdded(player)
    local userId   = getBackendUserId(player)
    local plotName = acquirePlot()

    if not plotName then
        warn("No free plots for", player.Name)
        return
    end

    playerToPlot[player.Name]   = plotName
    playerToUserId[player.Name] = userId

    print(player.Name, "→", userId, "→", plotName)
    fetchAndPopulate(userId, plotName)
end

local function onPlayerRemoving(player)
    local plotName = playerToPlot[player.Name]
    if not plotName then return end

    local plot = Workspace:FindFirstChild(plotName)
    if plot then clearPlot(plot) end

    playerToPlot[player.Name]   = nil
    playerToUserId[player.Name] = nil
    releasePlot(plotName)

    print(player.Name, "left —", plotName, "returned to pool")
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)

-- ── Auto-refresh loop ─────────────────────────────────────────────────────────

task.spawn(function()
    while true do
        task.wait(REFRESH_INTERVAL)
        for playerName, plotName in pairs(playerToPlot) do
            local userId = playerToUserId[playerName]
            if userId then
                fetchAndPopulate(userId, plotName)
            end
        end
    end
end)

-- ── Seed players already in-game (Studio Play mode) ──────────────────────────

for _, player in ipairs(Players:GetPlayers()) do
    onPlayerAdded(player)
end
