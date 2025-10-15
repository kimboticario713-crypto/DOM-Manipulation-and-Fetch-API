// CONFIG
    const API_BASE_URL = 'http://localhost:8080';
    // STATE
    let items = [];
    let fields = ['id', 'username', 'description', 'targetDate', 'done'];
    let idField = 'id';
    let selectedId = null;
    let selectedItem = null;
    let currentUsername = 'darshan';
    // DOM
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    const messageEl = document.getElementById('message');
    const createBtn = document.getElementById('createBtn');
    const updateBtnTop = document.getElementById('updateBtnTop');
    const deleteBtnTop = document.getElementById('deleteBtnTop');
    const formModal = document.getElementById('formModal');
    const formTitle = document.getElementById('formTitle');
    const formFields = document.getElementById('formFields');
    const dynamicForm = document.getElementById('dynamicForm');
    const formError = document.getElementById('formError');
    const cancelForm = document.getElementById('cancelForm');
    const submitForm = document.getElementById('submitForm');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    const userInput = document.getElementById('userInput');
    const switchUserBtn = document.getElementById('switchUserBtn');

    // UTILS
    function apiUrl(username) {
      return `${API_BASE_URL}/users/${encodeURIComponent(username)}/todos`;
    }
    function showMessage(text, isError = false) { messageEl.textContent = text; messageEl.className = isError ? 'meta error' : 'meta'; if (isError) console.error(text);}
    function showSuccess(text) { messageEl.textContent = text; messageEl.className = 'meta success'; }
    function showError(text){ formError.style.display='block'; formError.textContent = text; }
    function clearError(){ formError.style.display='none'; formError.textContent=''; }
    function setFormSubmitting(isSubmitting) {
      submitText.style.display = isSubmitting ? 'none' : 'inline-block';
      submitSpinner.style.display = isSubmitting ? 'inline-block' : 'none';
      submitForm.disabled = isSubmitting;
      cancelForm.disabled = isSubmitting;
    }
    function getIdValue(obj){ return obj[idField]; }
    function updateButtonStates() {
      const hasSelection = selectedId !== null;
      updateBtnTop.disabled = !hasSelection;
      deleteBtnTop.disabled = !hasSelection;
    }
    function validateFormData(formData) {
      const errors = [];
      if (!formData.username || formData.username.trim() === '') errors.push('Username is required');
      if (!formData.description || formData.description.trim() === '') errors.push('Description is required');
      if (!formData.targetDate) errors.push('Target date is required');
      return errors;
    }
    // DATA OPERATIONS
    async function fetchData(){
      showMessage(`Loading data for "${currentUsername}"...`);
      try {
        const res = await fetch(apiUrl(currentUsername));
        if(!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        items = Array.isArray(data) ? data : (data ? [data] : []);
        renderTable();
        showMessage(`Loaded ${items.length} todo items for "${currentUsername}".`);
      } catch (err){
        items = [];
        renderTable();
        showMessage(`Error fetching data: ${err.message}.`, true);
      }
    }
    // TABLE RENDERING
    function renderTable(){
      tableHead.innerHTML = '';
      tableBody.innerHTML = '';
      // Table head
      const htr = document.createElement('tr');
      fields.forEach(f => {
        const th = document.createElement('th');
        th.textContent = f.toUpperCase();
        htr.appendChild(th);
      });
      const thAction = document.createElement('th');
      thAction.textContent = 'ACTIONS';
      htr.appendChild(thAction);
      tableHead.appendChild(htr);
      // Table body
      if(items.length === 0){
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = fields.length + 1;
        td.className = 'meta';
        td.textContent = 'No todos found. Click CREATE to add one.';
        tr.appendChild(td);
        tableBody.appendChild(tr);
        return;
      }
      items.forEach(item => {
        const tr = document.createElement('tr');
        const itemId = String(getIdValue(item));
        tr.dataset.rowId = itemId;
        if (selectedId === itemId) tr.classList.add('selected');
        fields.forEach(f => {
          const td = document.createElement('td');
          const val = item[f];
          if(val === null || val === undefined) td.textContent = '';
          else if(typeof val === 'object') td.textContent = JSON.stringify(val);
          else if (f === 'done') {
            const badge = document.createElement('span');
            badge.className = `status-badge status-${val}`;
            badge.textContent = val ? 'Completed' : 'Pending';
            td.appendChild(badge);
          } else td.textContent = String(val);
          tr.appendChild(td);
        });
        // Actions
        const actionTd = document.createElement('td');
        actionTd.innerHTML = `
          <button class="btn" style="padding:6px 8px;font-size:13px" onclick="handleEditFromRow(event)">Edit</button>
          <button class="btn warn" style="margin-left:8px;padding:6px 8px;font-size:13px" onclick="handleDeleteFromRow(event)">Delete</button>
        `;
        tr.appendChild(actionTd);
        tr.addEventListener('click', (ev) => {
          if(ev.target.tagName === 'BUTTON') return;
          selectRow(tr, item);
        });
        tableBody.appendChild(tr);
      });
      updateButtonStates();
    }
    // ROW SELECTION
    function selectRow(tr, item){
      document.querySelectorAll('tbody tr').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected');
      selectedId = String(getIdValue(item));
      selectedItem = item;
      updateButtonStates();
    }
    // FORM MANAGEMENT
    function openForm(mode = 'create', item = null){
      clearError();
      formFields.innerHTML = '';
      formTitle.textContent = mode === 'create' ? 'Create New Todo' : 'Update Todo';
      // ID (readonly if update)
      if (mode === 'update' && item) {
        const idWrapper = document.createElement('div');
        idWrapper.className = 'full';
        const idLabel = document.createElement('label');
        idLabel.textContent = 'ID';
        idLabel.htmlFor = 'id';
        const idInput = document.createElement('input');
        idInput.type = 'text';
        idInput.id = 'id';
        idInput.name = 'id';
        idInput.value = item.id;
        idInput.readOnly = true;
        idInput.style.backgroundColor = '#f5f5f5';
        idWrapper.appendChild(idLabel);
        idWrapper.appendChild(idInput);
        formFields.appendChild(idWrapper);
      }
      // Username (readonly, always current username)
      const usernameWrapper = document.createElement('div');
      usernameWrapper.className = 'full';
      const usernameLabel = document.createElement('label');
      usernameLabel.textContent = 'Username';
      usernameLabel.htmlFor = 'username';
      const usernameInput = document.createElement('input');
      usernameInput.type = 'text';
      usernameInput.id = 'username';
      usernameInput.name = 'username';
      usernameInput.required = true;
      usernameInput.value = currentUsername;
      usernameInput.readOnly = true;
      usernameInput.style.backgroundColor = '#f5f5f5';
      usernameWrapper.appendChild(usernameLabel);
      usernameWrapper.appendChild(usernameInput);
      formFields.appendChild(usernameWrapper);
      // Description
      const descWrapper = document.createElement('div');
      descWrapper.className = 'full';
      const descLabel = document.createElement('label');
      descLabel.textContent = 'Description';
      descLabel.htmlFor = 'description';
      const descInput = document.createElement('input');
      descInput.type = 'text';
      descInput.id = 'description';
      descInput.name = 'description';
      descInput.required = true;
      descInput.value = mode === 'update' && item ? item.description : '';
      descWrapper.appendChild(descLabel);
      descWrapper.appendChild(descInput);
      formFields.appendChild(descWrapper);
      // Target Date
      const dateWrapper = document.createElement('div');
      dateWrapper.className = 'full';
      const dateLabel = document.createElement('label');
      dateLabel.textContent = 'Target Date';
      dateLabel.htmlFor = 'targetDate';
      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.id = 'targetDate';
      dateInput.name = 'targetDate';
      dateInput.required = true;
      if(mode === 'update' && item && item.targetDate)
        dateInput.value = (typeof item.targetDate === 'string') ? item.targetDate.slice(0,10) : '';
      else dateInput.value = new Date().toISOString().split('T')[0];
      dateWrapper.appendChild(dateLabel);
      dateWrapper.appendChild(dateInput);
      formFields.appendChild(dateWrapper);
      // Done
      const doneWrapper = document.createElement('div');
      doneWrapper.className = 'full';
      const doneLabel = document.createElement('label');
      doneLabel.textContent = 'Status';
      doneLabel.htmlFor = 'done';
      const doneSelect = document.createElement('select');
      doneSelect.id = 'done';
      doneSelect.name = 'done';
      doneSelect.required = true;
      const optionFalse = document.createElement('option');
      optionFalse.value = 'false';
      optionFalse.textContent = 'Pending';
      const optionTrue = document.createElement('option');
      optionTrue.value = 'true';
      optionTrue.textContent = 'Completed';
      doneSelect.appendChild(optionFalse);
      doneSelect.appendChild(optionTrue);
      if(mode === 'update' && item) doneSelect.value = String(item.done);
      else doneSelect.value = 'false';
      doneWrapper.appendChild(doneLabel);
      doneWrapper.appendChild(doneSelect);
      formFields.appendChild(doneWrapper);
      submitForm.textContent = mode === 'create' ? 'Create' : 'Update';
      formModal.style.display = 'flex';
      dynamicForm.dataset.mode = mode;
      dynamicForm.dataset.id = item ? String(getIdValue(item)) : '';
    }
    // EVENT HANDLERS
    createBtn.addEventListener('click', () => openForm('create'));
    updateBtnTop.addEventListener('click', () => {
      if(!selectedId) { showMessage('Please select a todo item to update.', true); return;}
      openForm('update', selectedItem);
    });
    deleteBtnTop.addEventListener('click', () => {
      if(!selectedId) { showMessage('Please select a todo item to delete.', true); return;}
      if(!confirm('Are you sure you want to delete this todo?')) return;
      doDelete(selectedId);
    });
    window.handleEditFromRow = function(evt){
      evt.stopPropagation();
      const tr = evt.currentTarget.closest('tr');
      const rid = tr.dataset.rowId;
      const item = items.find(it => String(getIdValue(it)) === rid);
      openForm('update', item);
    };
    window.handleDeleteFromRow = function(evt){
      evt.stopPropagation();
      const tr = evt.currentTarget.closest('tr');
      const rid = tr.dataset.rowId;
      if(!confirm('Are you sure you want to delete this todo?')) return;
      doDelete(rid);
    };
    cancelForm.addEventListener('click', () => { formModal.style.display = 'none'; clearError(); });
    dynamicForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      clearError();
      setFormSubmitting(true);
      const mode = dynamicForm.dataset.mode || 'create';
      const id = dynamicForm.dataset.id || '';
      const formData = new FormData(dynamicForm);
      const payload = {};
      for(const [k,v] of formData.entries()){
        if(v === '') { payload[k] = null; continue; }
        if(k === 'done') payload[k] = v === 'true';
        else payload[k] = v;
      }
      const errors = validateFormData(payload);
      if (errors.length > 0) { setFormSubmitting(false); showError(errors.join(', ')); return; }
      try {
        if(mode === 'create'){ delete payload.id; await doCreate(payload); }
        else { const targetId = id || payload.id; if(!targetId) throw new Error('Cannot determine id for update.'); await doUpdate(targetId, payload);}
      } catch (err) { showError(err.message || 'Operation failed'); setFormSubmitting(false);}
    });
    async function doCreate(payload){
      try {
        const res = await fetch(apiUrl(currentUsername), {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        if(!res.ok) {
          const errorText = await res.text();
          throw new Error(`Create failed: ${res.status} - ${errorText}`);
        }
        formModal.style.display = 'none';
        await fetchData();
        showSuccess('Todo created successfully.');
      } finally { setFormSubmitting(false);}
    }
    async function doUpdate(id, payload){
      try {
        const res = await fetch(`${apiUrl(currentUsername)}/${id}`, {
          method: 'PUT',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        if(!res.ok) {
          const errorText = await res.text();
          throw new Error(`Update failed: ${res.status} - ${errorText}`);
        }
        formModal.style.display = 'none';
        await fetchData();
        showSuccess('Todo updated successfully.');
      } finally { setFormSubmitting(false);}
    }
    async function doDelete(id){
      try {
        const res = await fetch(`${apiUrl(currentUsername)}/${id}`, { method: 'DELETE' });
        if(!res.ok) {
          const errorText = await res.text();
          throw new Error(`Delete failed: ${res.status} - ${errorText}`);
        }
        selectedId = null;
        selectedItem = null;
        await fetchData();
        showSuccess('Todo deleted successfully.');
      } catch (err) {
        showMessage('Delete error: ' + err.message, true);
        throw err;
      }
    }
    // USERNAME SWITCH
    switchUserBtn.addEventListener('click', () => {
      const newUser = userInput.value.trim();
      if(!newUser) { showMessage('Username cannot be empty', true); return;}
      currentUsername = newUser;
      selectedId = null;
      selectedItem = null;
      fetchData();
    });
    userInput.addEventListener('keydown', (e) => {
      if(e.key === 'Enter') switchUserBtn.click();
    });
    // INIT
    document.addEventListener('DOMContentLoaded', () => { fetchData(); });
