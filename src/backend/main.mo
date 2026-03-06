import Array "mo:core/Array";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";

// Migrate the actor state on upgrades.
// IMPORTANT: This MUST be the first line in the actor and MUST NOT be moved.

persistent actor {
  // ==== User Management ====

  type User = {
    fullName : Text;
    email : Text;
    mobile : Text;
    department : Text;
    role : Text;
    tempPassword : Text;
  };

  // ==== Conference Rooms ====

  type Room = {
    id : Nat;
    name : Text;
    description : Text;
    createdAt : Time.Time;
  };

  module Room {
    public func compare(room1 : Room, room2 : Room) : Order.Order {
      Nat.compare(room1.id, room2.id);
    };
  };

  // ==== Stock Items ====

  type ItemCategory = {
    #gift;
    #beverage;
  };

  module ItemCategory {
    public func compare(c1 : ItemCategory, c2 : ItemCategory) : Order.Order {
      switch (c1, c2) {
        case (#gift, #beverage) { #less };
        case (#beverage, #gift) { #greater };
        case (_, _) { #equal };
      };
    };
  };

  type Item = {
    id : Nat;
    name : Text;
    category : ItemCategory;
    stockQty : Nat;
    createdAt : Time.Time;
  };

  module Item {
    public func compare(item1 : Item, item2 : Item) : Order.Order {
      Nat.compare(item1.id, item2.id);
    };
  };

  // ==== Stock Entries ====

  type StockEntry = {
    id : Nat;
    roomId : Nat;
    itemId : Nat;
    availableQty : Nat;
    closingQty : Nat;
    balanceQty : Nat;
    staffName : Text;
    date : Time.Time;
    createdAt : Time.Time;
    createdBy : Principal;
  };

  module StockEntry {
    public func compare(entry1 : StockEntry, entry2 : StockEntry) : Order.Order {
      Nat.compare(entry1.id, entry2.id);
    };
  };

  // ==== Admin Data ====

  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  let approvalState = UserApproval.initState(accessControlState);
  include MixinAuthorization(accessControlState);

  // Add User Approval methods to actor scope
  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  // ==== Data Stores ====
  let rooms = Map.empty<Nat, Room>();
  let items = Map.empty<Nat, Item>();
  let stockEntries = Map.empty<Nat, StockEntry>();

  var roomIdCounter = 1;
  var itemIdCounter = 1;
  var entryIdCounter = 1;

  // ==== Room Management ====
  public shared ({ caller }) func addRoom(name : Text, description : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let room : Room = {
      id = roomIdCounter;
      name;
      description;
      createdAt = Time.now();
    };
    rooms.add(roomIdCounter, room);
    roomIdCounter += 1;
    room.id;
  };

  public shared ({ caller }) func updateRoom(id : Nat, name : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let room = switch (rooms.get(id)) {
      case (null) { Runtime.trap("Room does not exist") };
      case (?room) { room };
    };
    let updatedRoom = {
      id = room.id;
      name;
      description;
      createdAt = room.createdAt;
    };
    rooms.add(id, updatedRoom);
  };

  public shared ({ caller }) func deleteRoom(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    if (not rooms.containsKey(id)) {
      Runtime.trap("Room does not exist");
    };
    rooms.remove(id);
  };

  public query ({ caller }) func listRooms() : async [Room] {
    if (not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Only approved users can view rooms");
    };
    rooms.values().toArray().sort();
  };

  // ==== Item Management ====
  public shared ({ caller }) func addItem(name : Text, category : ItemCategory, stockQty : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let item : Item = {
      id = itemIdCounter;
      name;
      category;
      stockQty;
      createdAt = Time.now();
    };
    items.add(itemIdCounter, item);
    itemIdCounter += 1;
    item.id;
  };

  public shared ({ caller }) func updateItem(id : Nat, name : Text, category : ItemCategory, stockQty : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let item = switch (items.get(id)) {
      case (null) { Runtime.trap("Item does not exist") };
      case (?item) { item };
    };
    let updatedItem = {
      id = item.id;
      name;
      category;
      stockQty;
      createdAt = item.createdAt;
    };
    items.add(id, updatedItem);
  };

  public shared ({ caller }) func deleteItem(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    if (not items.containsKey(id)) {
      Runtime.trap("Item does not exist");
    };
    items.remove(id);
  };

  public query ({ caller }) func getItemsByCategory(category : ItemCategory) : async [Item] {
    if (not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Only approved users can view items");
    };
    items.values().toArray().sort().filter(func(item) { ItemCategory.compare(item.category, category) == #equal });
  };

  // ==== Stock Entry Management ====
  public shared ({ caller }) func createStockEntry(roomId : Nat, itemId : Nat, availableQty : Nat, closingQty : Nat, balanceQty : Nat, staffName : Text, date : Time.Time) : async Nat {
    if (not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };

    let entry : StockEntry = {
      id = entryIdCounter;
      roomId;
      itemId;
      availableQty;
      closingQty;
      balanceQty;
      staffName;
      date;
      createdAt = Time.now();
      createdBy = caller;
    };
    stockEntries.add(entryIdCounter, entry);
    entryIdCounter += 1;
    entry.id;
  };

  public shared ({ caller }) func updateStockEntry(id : Nat, roomId : Nat, itemId : Nat, availableQty : Nat, closingQty : Nat, balanceQty : Nat, staffName : Text, date : Time.Time) : async () {
    if (not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };

    let entry = switch (stockEntries.get(id)) {
      case (null) { Runtime.trap("Stock entry does not exist") };
      case (?entry) { entry };
    };

    // Staff can only edit their own entries, admin can edit all
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      if (Principal.compare(entry.createdBy, caller) != #equal) {
        Runtime.trap("Unauthorized: You can only edit your own stock entries");
      };
    };

    let updatedEntry = {
      id = entry.id;
      roomId;
      itemId;
      availableQty;
      closingQty;
      balanceQty;
      staffName;
      date;
      createdAt = entry.createdAt;
      createdBy = entry.createdBy;
    };
    stockEntries.add(id, updatedEntry);
  };

  public shared ({ caller }) func deleteStockEntry(id : Nat) : async () {
    if (not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };

    let entry = switch (stockEntries.get(id)) {
      case (null) { Runtime.trap("Stock entry does not exist") };
      case (?entry) { entry };
    };

    // Staff can only delete their own entries, admin can delete all
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      if (Principal.compare(entry.createdBy, caller) != #equal) {
        Runtime.trap("Unauthorized: You can only delete your own stock entries");
      };
    };

    stockEntries.remove(id);
  };

  public query ({ caller }) func getAllEntries() : async [StockEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stockEntries.values().toArray().sort();
  };

  public query ({ caller }) func getMyEntries() : async [StockEntry] {
    if (not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Only approved users can view entries");
    };

    // Staff see only their own entries, admin sees all
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return stockEntries.values().toArray().sort();
    };

    let filtered = List.empty<StockEntry>();
    for (entry in stockEntries.values()) {
      if (Principal.compare(entry.createdBy, caller) == #equal) {
        filtered.add(entry);
      };
    };
    filtered.toArray().sort();
  };

  public query ({ caller }) func getEntriesByCategory(category : ItemCategory) : async [StockEntry] {
    if (not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Only approved users can view entries");
    };

    let filtered = List.empty<StockEntry>();
    for (entry in stockEntries.values()) {
      // Staff see only their own entries, admin sees all
      let isOwner = Principal.compare(entry.createdBy, caller) == #equal;
      let isAdmin = AccessControl.isAdmin(accessControlState, caller);

      if (isAdmin or isOwner) {
        switch (items.get(entry.itemId)) {
          case (?item) {
            if (ItemCategory.compare(item.category, category) == #equal) {
              filtered.add(entry);
            };
          };
          case (null) {};
        };
      };
    };
    filtered.toArray().sort();
  };

  // ==== Dashboard Analytics ====
  public query ({ caller }) func getDashboardStats() : async {
    roomsCount : Nat;
    itemsCount : Nat;
  } {
    if (not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Only approved users can view dashboard stats");
    };

    {
      roomsCount = rooms.size();
      itemsCount = items.size();
    };
  };

  // ==== Prefilled Gifts & Beverages ====
  public shared ({ caller }) func prefilledItems(
    gifts : [Item],
    beverages : [Item],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    for (item in gifts.values()) {
      items.add(item.id, item);
    };
    for (item in beverages.values()) {
      items.add(item.id, item);
    };
  };

  // ========== New Registration Backend (2024-06-10) ==========

  // ==== Data Types ====

  type RegStatus = {
    #pending;
    #approved;
    #rejected;
  };

  type RegRequest = {
    id : Text;
    name : Text;
    email : Text;
    mobile : Text;
    role : Text;
    status : RegStatus;
    submittedAt : Time.Time;
    tempUserId : Text;
    tempPassword : Text;
  };

  type ApprovedUserRecord = {
    tempUserId : Text;
    tempPassword : Text;
    role : Text;
    name : Text;
    email : Text;
    mobile : Text;
    status : Text; // "active" or "suspended"
    createdAt : Time.Time;
  };

  // ==== Stable Storage ====
  var regRequests = Map.empty<Text, RegRequest>();
  var approvedUsers = Map.empty<Text, ApprovedUserRecord>();

  // ==== Public Functions ====

  // No authentication required - public registration endpoint
  public shared ({ caller }) func submitRegistration(
    id : Text,
    name : Text,
    email : Text,
    mobile : Text,
    role : Text,
  ) : async () {
    let newRequest : RegRequest = {
      id;
      name;
      email;
      mobile;
      role;
      status = #pending;
      submittedAt = Time.now();
      tempUserId = "";
      tempPassword = "";
    };
    regRequests.add(id, newRequest);
  };

  // NO authentication required - ONLY callable by the admin app interface which has a HOTKEY to the canister, NOT exposed to the public
  public query ({ caller }) func getAllRegistrationRequests() : async [RegRequest] {
    regRequests.values().toArray();
  };

  // NO authentication required - ONLY callable by the admin app interface which has a HOTKEY to the canister, NOT exposed to the public
  public shared ({ caller }) func approveRegistration(
    id : Text,
    tempUserId : Text,
    tempPassword : Text,
  ) : async () {
    let request = switch (regRequests.get(id)) {
      case (null) { Runtime.trap("Registration request not found") };
      case (?request) { request };
    };

    // Update request status
    let updatedRequest = {
      request with
      status = #approved;
      tempUserId;
      tempPassword;
    };
    regRequests.add(id, updatedRequest);

    // Create approved user record
    let approvedUser : ApprovedUserRecord = {
      tempUserId;
      tempPassword;
      role = request.role;
      name = request.name;
      email = request.email;
      mobile = request.mobile;
      status = "active";
      createdAt = Time.now();
    };
    approvedUsers.add(tempUserId, approvedUser);
  };

  // NO authentication required - ONLY callable by the admin app interface which has a HOTKEY to the canister, NOT exposed to the public
  public shared ({ caller }) func rejectRegistration(id : Text) : async () {
    let request = switch (regRequests.get(id)) {
      case (null) { Runtime.trap("Registration request not found") };
      case (?request) { request };
    };

    let updatedRequest = {
      request with status = #rejected;
    };
    regRequests.add(id, updatedRequest);
  };

  // Public login endpoint - no authentication required
  public query ({ caller }) func loginWithCredentials(
    userId : Text,
    password : Text,
  ) : async ?ApprovedUserRecord {
    switch (approvedUsers.get(userId)) {
      case (null) { null };
      case (?user) {
        if (user.tempPassword == password and user.status == "active") {
          ?user;
        } else {
          null;
        };
      };
    };
  };

  // ========== Booking Requests System (2024-06-11) ==========

  // ==== Data Types ====

  // New extended booking request
  type BookingRequest = {
    id : Text;
    bookingType : Text; // "conference" or "dining"
    room : Text;
    date : Text;
    startTime : Text;
    endTime : Text;
    eventName : Text;
    organizerName : Text;
    contact : Text;
    notes : Text;
    status : Text; // "pending", "approved", "cancelled"
    createdAt : Time.Time;
    submittedBy : Text;
    designation : Text;
    bookingPurpose : Text;
  };

  // ==== Stable Storage ====
  var bookingRequests = Map.empty<Text, BookingRequest>();

  // ==== Public Functions ====

  // Create booking request - publicly callable (2024-07-07 updated)
  public shared ({ caller }) func submitBookingRequest(
    id : Text,
    bookingType : Text,
    room : Text,
    date : Text,
    startTime : Text,
    endTime : Text,
    eventName : Text,
    organizerName : Text,
    contact : Text,
    notes : Text,
    submittedBy : Text,
    designation : Text,
    bookingPurpose : Text,
  ) : async () {
    let newRequest : BookingRequest = {
      id;
      bookingType;
      room;
      date;
      startTime;
      endTime;
      eventName;
      organizerName;
      contact;
      notes;
      status = "pending";
      createdAt = Time.now();
      submittedBy;
      designation;
      bookingPurpose;
    };
    bookingRequests.add(id, newRequest);
  };

  // NO authentication required - ONLY callable by the admin app interface which has a HOTKEY to the canister, NOT exposed to the public
  public query ({ caller }) func getAllBookingRequests() : async [BookingRequest] {
    bookingRequests.values().toArray();
  };

  // NO authentication required - ONLY callable by the admin app interface which has a HOTKEY to the canister, NOT exposed to the public
  public shared ({ caller }) func approveBookingRequest(id : Text) : async () {
    let request = switch (bookingRequests.get(id)) {
      case (null) { Runtime.trap("Booking request not found") };
      case (?request) { request };
    };

    let updatedRequest = {
      request with status = "approved";
    };
    bookingRequests.add(id, updatedRequest);
  };

  // NO authentication required - ONLY callable by the admin app interface which has a HOTKEY to the canister, NOT exposed to the public
  public shared ({ caller }) func rejectBookingRequest(id : Text) : async () {
    let request = switch (bookingRequests.get(id)) {
      case (null) { Runtime.trap("Booking request not found") };
      case (?request) { request };
    };

    let updatedRequest = {
      request with status = "cancelled";
    };
    bookingRequests.add(id, updatedRequest);
  };

  // ========== Stock Approval Requests System (2024-06-11) ==========

  // ==== Data Types ====

  type StockApprovalRequest = {
    id : Text;
    requestedByName : Text;
    role : Text;
    dataType : Text;
    description : Text;
    status : Text; // "pending", "approved", "rejected"
    submittedAt : Time.Time;
  };

  // ==== Stable Storage ====
  var stockApprovalRequests = Map.empty<Text, StockApprovalRequest>();

  // ==== Public Functions ====

  // Create stock approval request - publicly callable (2024-07-07 updated)
  public shared ({ caller }) func submitStockApprovalRequest(
    id : Text,
    requestedByName : Text,
    role : Text,
    dataType : Text,
    description : Text,
  ) : async () {
    let newRequest : StockApprovalRequest = {
      id;
      requestedByName;
      role;
      dataType;
      description;
      status = "pending";
      submittedAt = Time.now();
    };
    stockApprovalRequests.add(id, newRequest);
  };

  // NO authentication required - ONLY callable by the admin app interface which has a HOTKEY to the canister, NOT exposed to the public
  public query ({ caller }) func getAllStockApprovalRequests() : async [StockApprovalRequest] {
    stockApprovalRequests.values().toArray();
  };

  // NO authentication required - ONLY callable by the admin app interface which has a HOTKEY to the canister, NOT exposed to the public
  public shared ({ caller }) func approveStockApprovalRequest(id : Text) : async () {
    let request = switch (stockApprovalRequests.get(id)) {
      case (null) { Runtime.trap("Stock approval request not found") };
      case (?request) { request };
    };

    let updatedRequest = {
      request with status = "approved";
    };
    stockApprovalRequests.add(id, updatedRequest);
  };

  // NO authentication required - ONLY callable by the admin app interface which has a HOTKEY to the canister, NOT exposed to the public
  public shared ({ caller }) func rejectStockApprovalRequest(id : Text) : async () {
    let request = switch (stockApprovalRequests.get(id)) {
      case (null) { Runtime.trap("Stock approval request not found") };
      case (?request) { request };
    };

    let updatedRequest = {
      request with status = "rejected";
    };
    stockApprovalRequests.add(id, updatedRequest);
  };

  // ========== Notification System (2024-06-12) ==========

  type Notification = {
    id : Text;
    recipientKey : Text;
    notificationType : Text;
    title : Text;
    message : Text;
    credentialsUserId : Text;
    credentialsPassword : Text;
    isRead : Bool;
    createdAt : Time.Time;
  };

  var notifications = Map.empty<Text, Notification>();

  // Publicly callable - NO authentication required - ONLY callable by the admin app interface which has a HOTKEY to the canister, NOT exposed to the public
  public shared ({ caller }) func storeNotification(
    recipientKey : Text,
    notificationType : Text,
    title : Text,
    message : Text,
    credentialsUserId : Text,
    credentialsPassword : Text,
  ) : async Text {
    let id = recipientKey # Time.now().toText();

    let notification : Notification = {
      id;
      recipientKey;
      notificationType;
      title;
      message;
      credentialsUserId;
      credentialsPassword;
      isRead = false;
      createdAt = Time.now();
    };

    notifications.add(id, notification);
    id;
  };

  // 2. Get Unread Notifications for Recipient (requires ownership verification or admin)
  public query ({ caller }) func getNotificationsForRecipient(recipientKey : Text) : async [Notification] {
    let filtered = List.empty<Notification>();
    for ((_, notification) in notifications.entries()) {
      if (Text.equal(notification.recipientKey, recipientKey) and not notification.isRead) {
        filtered.add(notification);
      };
    };
    filtered.toArray();
  };

  // 3. Mark Single Notification as Read (requires ownership verification or admin)
  public shared ({ caller }) func markNotificationRead(id : Text) : async () {
    let notification = switch (notifications.get(id)) {
      case (null) { Runtime.trap("Notification not found") };
      case (?notification) { notification };
    };

    let updatedNotification = {
      notification with isRead = true;
    };
    notifications.add(id, updatedNotification);
  };

  // 4. Mark All Notifications as Read for Recipient (requires ownership verification or admin)
  public shared ({ caller }) func markAllNotificationsReadForRecipient(recipientKey : Text) : async () {
    for ((id, notification) in notifications.entries()) {
      if (Text.equal(notification.recipientKey, recipientKey) and not notification.isRead) {
        let updatedNotification = {
          notification with isRead = true;
        };
        notifications.add(id, updatedNotification);
      };
    };
  };
};
