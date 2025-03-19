document.onload = function() {
    root = document.getElementById("root");
}

function renderError(message = null){
    // Render an error with the optional message
}

function buildPage(data) {
    if (!data['type'] && data['type'] !== "panel") {
        renderError();
        return;
    }
    set_page_header(data['title'], data['path'], data['name'], data['shot']);

    set_page_form(data['fields']);
    
}

function set_page_header(deviceName, devicePath, treeName, treeShot) {
    var head = document.getElementById('header');

    head.innerHTML = (`
        <h1 class="text-center">${deviceName}</h1>
        <ul class="container">
            <li><b>Path: ${devicePath}</b></li>
            <li><b>Tree: ${treeName}</b></li>
            <li><b>Shot: ${treeShot}</b></li>
        </ul>`)
}

function set_page_form(fields) {
    var form = document.getElementById('device-setup-form');
    
    var submit = document.createElement('input');
    submit.type = "submit";

    fields.forEach(field => {
        build_input(field, form);
    });

    form.appendChild(submit);
    // form.addEventListener("submit", form_submit);

    function handleSubmit(event) {
        console.log("handleSubmit");
        for (i = 0; i < form.elements.length; i++) {
            element = form.elements[i];
            if (element.dataset.quoted == 'true') {
                element.value = '"' + element.value + '"';
            }
            if (element.dataset.ignored) {
                element.name="";
            }
        }
        return true;
    }
    form.addEventListener("submit", handleSubmit);
}

function build_input(field, parent) {
    type = field['type'];
    switch(type){
        case 'panel':
            build_panel(field, parent);
            break;
        case 'action':
            build_action_input(field, parent);
            break;
        case 'dropdown':
            build_dropdown_input(field, parent);
            break;
        default:
            build_text_input(field, parent);
            break;
    }
}

function expression_tokenizer(expression) {
    console.log(expression);

    let tree = [''];

    let count = 0;
    let running = true;
    for (let i = 0; running && i < expression.length; ++i) {
        ++count;

        let c = expression[i];
        switch (c){
        case '(':
            const [count, subTree] = expression_tokenizer(expression.substr(i + 1));
            i += count;
            tree.push([ tree.pop(), ...subTree ]);
            break;
        case ')':
            running = false;
            break;
        case ',':
            tree.push('');
            break;
        default:
            if (tree.at(-1).length == 0 && c == ' ') {
                // Skip leading whitespace
            }
            else {
                tree[tree.length - 1] += c;
            }
            break;
        // TODO: handle quotes
        }
    }
    if (tree.at(-1).length == 0) {
        tree.pop();
    }
    
    return [count, tree];
}


const BUILD_DISPATCH_START = 2
const BUILD_METHOD_START = 15

function set_action_values(tokens, field){
    prefix = `${field['path']}_build`;
    
    // TODO: len(tokens) == 0
    // let first_token_group = tokens[0];
    
    action_tokens = tokens[0];
    // BUILD ACTION
    if (action_tokens.length > 0 && action_tokens[0].toLowerCase() == "build_action") {

        let dispatch_tokens = action_tokens[1];
        if (dispatch_tokens.length > 0 && dispatch_tokens[0].toLowerCase() == "build_dispatch") {
            d_server    = dispatch_tokens[2];
            d_phase     = dispatch_tokens[3];
            d_when      = dispatch_tokens[4];

            server = document.getElementById(`${prefix}-dispatch_server`);
            server.value = d_server;
            if (d_server[0] === '"' &&
                d_server[d_server.length - 1] === '"' &&
                (d_server.match(/"/g) || []).length == 2
            ) {
                addQuotes(server);
            }

            phase = document.getElementById(`${prefix}-dispatch_phase`)
            phase.value = d_phase;
            if (d_phase[0] === '"' &&
                d_phase[d_phase.length - 1] === '"' &&
                (d_phase.match(/"/g) || []).length == 2
            ) {
                addQuotes(phase);
            }

            when = document.getElementById(`${prefix}-dispatch_when`);
            when.value = d_when;
            if (d_when[0] === '"' &&
                d_when[d_when.length - 1] === '"' &&
                (d_when.match(/"/g) || []).length == 2
            ) {
                addQuotes(when);
            }
        }
        let method_tokens = action_tokens[2]
        if (method_tokens.length > 0 && method_tokens[0].toLowerCase().trim() == "build_method") {
            m_timeout   = method_tokens[1];
            m_method    = method_tokens[2];
            m_device    = method_tokens[3];
            timeout = document.getElementById(`${prefix}-method_timeout`)
            timeout.value = m_timeout;
            if (m_timeout[0] === '"' &&
                m_timeout[m_timeout.length - 1] === '"' &&
                (m_timeout.match(/"/g) || []).length == 2
            ) {
                addQuotes(timeout);
            }
            
            method = document.getElementById(`${prefix}-method_method`)
            method.value = m_method;
            if (m_method[0] === '"' &&
                m_method[m_method.length - 1] === '"' &&
                (m_method.match(/"/g) || []).length == 2
            ) {
                addQuotes(method);
            }
            
            device = document.getElementById(`${prefix}-method_device`)
            device.value = m_device;
            if (m_device[0] === '"' &&
                m_device[m_device.length - 1] === '"'
                (m_device.match(/"/g) || []).length == 2
            ) {
                addQuotes(device);
            }
        }
    }
}

function updateValues(field) {
    const [_, tokens] = expression_tokenizer(field['expression']);
    console.log(tokens);
    set_action_values(tokens, field);
}

function build_panel(field, parent) {
    area = document.createElement('fieldset');
    area.name = field['path'];
    area.innerHTML = `
        <legend>${field['title']}</legend>
    `
    parent.appendChild(area);

    field['fields'].forEach(child => {
        build_input(child, area);
    })
}

function build_action_input(field, parent) {
    area = document.createElement('div');
    parent.appendChild(area);
    area.classList.add("form-group");
    area.classList.add("form-inline");
    area.classList.add("p-1");


    inner = `
        <fieldset name="${field['path']}_Build_Action" class="align-middle">
            <legend>Build_Action</legend>
            <textarea rows="3"
            class="w-75 mt-2"
            name="${field['path']}">${field['expression']}</textarea>
            <fieldset name="${field['path']}_Build_Dispatch">
                <legend>Build_Dispatch</legend>
                <div class="row"><label class="lh-lg col-md-2" for="SERVER">Server</label><span class="col-md-4"><input class="col-md-10" id="${field['path']}_build-dispatch_server" type="text" name="SERVER" data-quoted="False" value="*" data-ignored="true" /></span></div>
                <div class="row"><label class="lh-lg col-md-2" for="PHASE">Phase</label><span class="col-md-4"><input class="col-md-10" id="${field['path']}_build-dispatch_phase" type="text" name="PHASE" data-quoted="False" value="*" data-ignored="true" /></span></div>
                <div class="row"><label class="lh-lg col-md-2" for="WHEN">When</label><span class="col-md-4"><input class="col-md-10" id="${field['path']}_build-dispatch_when" type="text" name="WHEN" data-quoted="False" value="*" data-ignored="true" /></span></div>
            </fieldset>
            <fieldset name="${field['path']}_Build_Method">
                <legend>Build_Method</legend>
                <div class="row row-no-gutters"><label class="lh-lg col-md-2" for="TIMEOUT">Timeout</label><span class="col-md-4"><input class="col-md-10" id="${field['path']}_build-method_timeout" type="text" name="TIMEOUT" data-quoted="False" value="*" data-ignored="true" /></span></div>
                <div class="row row-no-gutters"><label class="lh-lg col-md-2" for="METHOD">Method</label><span class="col-md-4"><input class="col-md-10" id="${field['path']}_build-method_method" type="text" name="METHOD" data-quoted="False" value="*" data-ignored="true" /></span></div>
                <div class="row row-no-gutters"><label class="lh-lg col-md-2" for="DEVICE">Device</label><span class="col-md-4"><input class="col-md-10" id="${field['path']}_build-method_device" type="text" name="DEVICE" data-quoted="False" value="*" data-ignored="true" /></span></div>

            </fieldset>
        </fieldset>
    `;

    // setTimeout(() => updateValues(field), 0);

    area.innerHTML = inner;
    updateValues(field);
}

function build_dropdown_input(field, parent) {
    area = document.createElement('div');
    parent.appendChild(area);

    updateValue = (v) => {
        e = document.getElementById(field["path"]);
        e.value = v;
    }

    area.innerHTML = `
    <label class="lh-lg col-md-2" for="${field["path"]}" data-toggle="tooltip" data-placement="top" title="${field['tooltip']}">${field["title"]}</label>
    <span class="btn-group col-md-4">
        <input type="text" name=${field['path']} class="col-md-11" id="${field["path"]}" value="${field['expression']}" />
        <button type="button" class="btn btn-primary dropdown-toggle dropdown-toggle-split col" data-bs-toggle="dropdown" aria-expanded="false">
            <span class="visually-hidden">Toggle Dropdown</span>
        </button>
        <ul class="dropdown-menu">
            ${!!field['options'] && field['options'].map(option => {
                return `<li><a class="dropdown-item" href="#" onclick="updateValue(${option})">${option}</a></li>`
            }).join("")}
        </ul>
    </span>
    `;
}

function removeQuotes(e) {
    inputName = e.target.dataset.input;
    elements = document.querySelectorAll(`button[data-input="${inputName}"]`);
    for( i = elements.length - 1; i >= 0 ; i--) {{
        elements[i].remove();
    }}

    const form = document.getElementById("device-setup-form");
    const input_element = form.elements[inputName];
    input_element.value = '"' + input_element.value + '"';
    input_element.dataset.quoted = 'false';

    return false;
}

function build_text_input(field, parent) {
    // type, title, path, expression, tooltip, options = field
    area = document.createElement('div');
    parent.appendChild(area);

    expression = field['expression'];
    
    label = `
    <label class="lh-lg" for="${field['path']}" data-toggle="tooltip" data-placement="top" title="${field['tooltip']}">${field['title']}</label>
    `;

    label = document.createElement('label');
    label.innerText = field['title'];
    label.classList.add('lh-lg');
    label.classList.add('col-md-2')
    label.dataset.toggle = "tooltip";
    label.dataset.placement = "top";

    label.setAttribute('for', field['path']);
    label.setAttribute('title', field['path']);
    area.appendChild(label);

    inputName = field['path']
    
    input_area = document.createElement('span');
    input_area.classList.add("col-md-4")
    // input_area.classList.add("container")
    area.appendChild(input_area);

    input = document.createElement('input');
    input.type = 'text';
    input.name = inputName;

    input.value = expression;

    input_area.appendChild(input);

    if (field['quoted']) {
        addQuotes(input);
    }
    else {
        input.classList.add('col-md-4')
    }
}

function addQuotes(element) {
    const QUOT = '"'

    element.dataset.quoted = "true";
    inputName = element.name;

    expression = element.value;

    if (expression.startsWith(QUOT)) {
        expression = expression.slice(QUOT.length);
    }
    if (expression.endsWith(QUOT)) {
        expression = expression.slice(0, expression.length - QUOT.length);
    }

    element.value = expression;

    leftButton = document.createElement('button');
    leftButton.classList.add('l-button');
    leftButton.dataset.input = inputName
    leftButton.addEventListener('click', removeQuotes);
    leftButton.innerText = "\""


    rightButton = document.createElement('button');
    rightButton.classList.add('r-button');
    rightButton.dataset.input = inputName
    rightButton.addEventListener('click', removeQuotes);
    rightButton.innerText = "\""
    
    element.classList.add("col-md-4")
    leftButton.classList.add("col")
    rightButton.classList.add("col")
    
    element.parentElement.insertBefore(leftButton, element);
    element.after(rightButton)
}
