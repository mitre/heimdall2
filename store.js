export const store = {
  state: {
    status: [
      ['Passed',         0],
      ['Failed',         0],
      ['Not Applicable', 0],
      ['Not Reviewed',   0],
      ['Profile Error',  0]
    ],
    impact: [
      ['low',       0],
      ['medium',    0],
      ['high',      0],
      ['critical',  0]
    ],
    families: [
      ['UM', 'Unmapped', 1],
      ['AC', 'Access Control', 25],
      ['AU', 'Audit and Accountability', 16],
      ['AT', 'Awareness and Training', 5],
      ['CM', 'Configuration Management', 11],
      ['CP', 'Contingency Planning', 13],
      ['IA', 'Identification and Authentication', 11],
      ['IR', 'Incident Response', 10],
      ['MA', 'Maintenance', 6],
      ['MP', 'Media Protection', 8],
      ['PS', 'Personnel Security', 8],
      ['PE', 'Physical and Environmental Protection', 20],
      ['PL', 'Planning', 9],
      ['PM', 'Program Management', 16],
      ['RA', 'Risk Assessment', 6],
      ['CA', 'Security Assessment and Authorization', 9],
      ['SC', 'System and Communications Protection', 44],
      ['SI', 'System and Information Integrity', 17],
      ['SA', 'System and Services Acquisition', 22]
    ],
    compliance: 0,
    status_filter: "none",
    impact_filter: "none",
    search_term: "",
    title: "",
    showing: "About",
    profile_name: "",
    version: "",
    controls: {},
    nist_hsh: {},
    controls_hsh: {},
    selected_family: "",
    selected_subfamily: "",
    selected_control: ""
  },
  reset() {
    store.controls = {},
    store.compliance = 0;
    store.status = [
      ['Passed',         0],
      ['Failed',         0],
      ['Not Applicable', 0],
      ['Not Reviewed',   0],
      ['Profile Error',  0]
    ];
    store.impact = [
      ['low',       0],
      ['medium',    0],
      ['high',      0],
      ['critical',  0]
    ];
    store.getStatus();
    store.getImpact();
    store.getCompliance();
    store.setStatusFilter("none");
    store.setImpactFilter("none");
  },
  parseFile(content, file_name) {
    for (var member in this.state.controls) delete this.state.controls[member];
    var json = JSON.parse(content);
    var profile_name, i, j;
    if (json.profiles == undefined) {
      profile_name = 'profile;' + json.name + ': ' + json.version;
      for (i = 0; i < json.controls.length; i++) {
        this.setControl(json.controls[i], profile_name);

      }
    }
    else {
      profile_name = 'result;' + file_name + ': ' + this.grab_start_time(json);
      for (i = 0; i < json.profiles.length; i++) {
        for (j = 0; j < json.profiles[i].controls.length; j++) {
          this.setControl(json.profiles[i].controls[j], profile_name);
        }
      }
    }
    this.setStatusFilter("");
    this.setImpactFilter("");
  },
  grab_start_time(json) {
    for (var i = 0; i < json.profiles.length; i++) {
      for (var j = 0; j < json.profiles[i].controls.length; j++) {
        if (json.profiles[i].controls[j] != {} && json.profiles[i].controls[j].results) {
          if (json.profiles[i].controls[j].results.length != 0) {
            return json.profiles[i].controls[j].results[0].start_time;
          }
        }
      }
    }
    return ''; // If no time was found, return empty string
  },

  setControl(control, profile_name) {
    var DATA_NOT_FOUND_MESSAGE = 'N/A';
    var c_id = control.id;
    var new_control = {};
    new_control.profile         = profile_name                                           || DATA_NOT_FOUND_MESSAGE;
    new_control.vuln_num        = control.id                                             || DATA_NOT_FOUND_MESSAGE;
    if (new_control.vuln_num.match(/\d+\.\d+/)) {
      new_control.vuln_num      = new_control.vuln_num.match(/\d+(\.\d+)*/)[0];
    }
    new_control.rule_title      = control.title                                                 || DATA_NOT_FOUND_MESSAGE;
    if (control.desc) {
      new_control.vuln_discuss  = control.desc.replace(new RegExp("\n", 'g'), '<br>')           || DATA_NOT_FOUND_MESSAGE;
    } else { new_control.vuln_discuss = DATA_NOT_FOUND_MESSAGE; }

    new_control.gid             = control.tags.gid                                              || DATA_NOT_FOUND_MESSAGE;
    new_control.group_title     = control.tags.gtitle                                           || DATA_NOT_FOUND_MESSAGE;
    new_control.rule_id         = control.tags.rid                                              || DATA_NOT_FOUND_MESSAGE;
    new_control.rule_ver        = control.tags.stig_id                                          || DATA_NOT_FOUND_MESSAGE;
    new_control.cci_ref         = control.tags.cci                                              || DATA_NOT_FOUND_MESSAGE;
    new_control.nist            = control.tags.nist                                             || ['unmapped'];
    if (control.tags.check) {
      new_control.check_content = control.tags.check.replace(new RegExp("\n", 'g'), '<br>')     || DATA_NOT_FOUND_MESSAGE;
    } else { new_control.check_content = DATA_NOT_FOUND_MESSAGE; }

    if (control.tags.fix) {
      new_control.fix_text      = control.tags.fix.replace(new RegExp("\n", 'g'), '<br>')       || DATA_NOT_FOUND_MESSAGE;
    } else { new_control.fix_text = DATA_NOT_FOUND_MESSAGE; }

    if (control.tags.rationale) {
      new_control.rationale     = control.tags.rationale.replace(new RegExp("\n", 'g'), '<br>') || DATA_NOT_FOUND_MESSAGE;
    } else { new_control.rationale = DATA_NOT_FOUND_MESSAGE; }

    new_control.cis_family      = control.tags.cis_family                                       || DATA_NOT_FOUND_MESSAGE;
    new_control.cis_rid         = control.tags.cis_rid                                          || DATA_NOT_FOUND_MESSAGE;
    new_control.cis_level       = control.tags.cis_level                                        || DATA_NOT_FOUND_MESSAGE;

    new_control.impact          = String(control.impact)                                        || DATA_NOT_FOUND_MESSAGE;
    new_control.severity        = this.compute_severity(control.impact)
    new_control.code            = String(control.code)                                          || DATA_NOT_FOUND_MESSAGE;

    new_control.status_list = [];
    new_control.message = '';

    if (parseFloat(new_control.impact) == 0) {
      new_control.message = new_control.vuln_discuss + "\n\n";
    }

    if (control.results) {
      // Concatenate all of the results messages
      var r_i = 0;
      control.results.forEach(function(result) {
        if (r_i == 0)
          new_control.start_time = result.start_time

        r_i += 1
        //console.log(control.id + ' status: ' + result.status + ', exception: ' + result.exception);
        if (result.bactrace != undefined) {
          result.status = 'error';
          //console.log("set status = " + result.status);
        }
        new_control.status_list.push(result.status);
        //console.log("status_list = " + new_control.status_list);
        if (result.status == 'skipped') { new_control.message += 'SKIPPED -- ' + result.skip_message + '\n'; }
        if (result.status == 'failed')  { new_control.message += 'FAILED -- Test: ' + result.code_desc + '\nMessage: ' + result.message + '\n'; }
        if (result.status == 'passed')  { new_control.message += 'PASSED -- ' + result.code_desc + '\n'; }
        if (result.status == 'error')  { new_control.message += 'ERROR -- Test: ' + result.code_desc + '\nMessage: ' + result.message + '\n'; }
        if (result.exception != undefined) {
          new_control.message += 'Exception: ' + result.exception + '\n';
        }
      });
    }

    new_control.status = this.compute_status(new_control);
    //console.log(c_id + " status: status_list = " + new_control.status);

    new_control.finding_details  = this.get_finding_details(new_control);
    this.state.controls[c_id] = new_control;
  },

  includes(string, myArray) {
    for (var i = 0; i < myArray.length; i++) {
      if (myArray[i] == string) {
        return true;
      }
    }
    return false;
  },
  compute_severity(impact) {
    if (impact < 0.1) {
      return'none';
    } else if (impact < 0.4) {
      return 'low';
    } else if (impact < 0.7) {
      return 'medium';
    } else if (impact < 0.9) {
      return 'high';
    } else if (impact >= 0.9) {
      return 'critical';
    }
  },
  compute_status(control) {
    var status_list = control.status_list;
    //console.log("compute_status: status_list = " + status_list);
    if (this.includes('error', status_list)) {
      return 'Profile Error';
    } else {
      if (parseFloat(control.impact) == 0) {
        return 'Not Applicable';
      } else if (this.includes('failed', status_list)) {
        return 'Failed';
      } else if (this.includes('passed', status_list)) {
        return 'Passed';
      } else if (this.includes('skipped', status_list)) {
        return 'Not Reviewed';
      } else {
        return 'Profile Error';
      }
    }
  },
  getBindValue() {
    return this.getStatusFilter() + this.getImpactFilter() + this.getSearchTerm()
      + this.getSelectedFamily() + this.getSelectedSubFamily() + this.getSelectedControl();
  },
  get_finding_details(control) {
    var result = '';
    if (control.status == 'Failed') { result = 'One or more of the automated tests failed or was inconclusive for the control \n\n ' + control.message; }
    if (control.status == 'Passed') { result = 'All Automated tests passed for the control \n\n ' + control.message; }
    if (control.status == 'Not Reviewed') { result = 'Automated test skipped due to known accepted condition in the control : \n\n' + control.message; }
    if (control.status == 'Not Applicable') { result = 'Justification: \n\n' + control.message + '\n'; }
    if (control.status == 'Profile Error') {
      if (control.message) {
        result = 'Exception: \n\n' + control.message + '\n';
      } else {
        result = 'No test available for this control';
      }
    }
    return result;
  },
  getControl(control_id) {
    return this.state.controls[control_id];
  },
  getControls() {
    var ctls = []
    var ctl_id = this.getSelectedControl();
    if (ctl_id != "") {
      ctls.push(this.getControl(ctl_id));
      return ctls;
    } else {
      var impact_filter = this.getImpactFilter();
      var status_filter = this.getStatusFilter();
      var fam_filter = '';
      if (this.getSelectedSubFamily() != "") {
        fam_filter = this.getSelectedSubFamily();
      } else if (this.getSelectedFamily() != "") {
        fam_filter = this.getSelectedFamily();
      }
      var controls = this.state.controls;
      for (var ind in controls) {
        var nist_val = controls[ind].nist ? controls[ind].nist.join() : 'UM-1';
        if (status_filter == "" || status_filter == controls[ind].status) {
          if (impact_filter == "" || impact_filter == controls[ind].severity) {
            if (fam_filter == "" || nist_val.includes(fam_filter)) {
              ctls.push(controls[ind]);
            }
          }
        }
      }
      let search = this.getSearchTerm();
      if (search == "") {
        return ctls;
      } else {
        return ctls.filter(function (ctl) {
          return ctl.gid.toLowerCase().indexOf(search) !== -1 ||
            ctl.rule_title.toLowerCase().indexOf(search) !== -1 ||
            ctl.severity.toLowerCase().indexOf(search) !== -1 ||
            ctl.status.toLowerCase().indexOf(search) !== -1 ||
            ctl.finding_details.toLowerCase().indexOf(search) !== -1 ||
            ctl.code.toLowerCase().indexOf(search) !== -1
        })
      }
    }
  },
  getNistControls() {
    var impact_filter = this.getImpactFilter();
    var status_filter = this.getStatusFilter();
    var controls = this.state.controls;
    var ctls = []
    for (var ind in controls) {
      if (status_filter == "" || status_filter == controls[ind].status) {
        if (impact_filter == "" || impact_filter == controls[ind].severity) {
          ctls.push(controls[ind]);
        }
      }
    }
    let search = this.getSearchTerm();
    if (search == "") {
      return ctls;
    } else {
      return ctls.filter(function (ctl) {
        return ctl.gid.toLowerCase().indexOf(search) !== -1 ||
          ctl.rule_title.toLowerCase().indexOf(search) !== -1 ||
          ctl.severity.toLowerCase().indexOf(search) !== -1 ||
          ctl.status.toLowerCase().indexOf(search) !== -1 ||
          ctl.finding_details.toLowerCase().indexOf(search) !== -1 ||
          ctl.code.toLowerCase().indexOf(search) !== -1
      })
    }
  },
  setProfileName(name) {
    this.state.profile_name = name;
  },
  getProfileName() {
    return this.state.profile_name
  },
  getStatus() {
    var statusHash = { 'Passed':  0,
      'Failed':           0,
      'Not Applicable': 0,
      'Not Reviewed':   0,
      'Profile Error':  0
    };
    var controls = this.getControls();
    for (var index in controls) {
      statusHash[controls[index].status] += 1;
    }
    for (var i = 0; i < this.state.status.length; i++) {
      this.state.status[i][1] = statusHash[this.state.status[i][0]];
    }
    this.setCompliance(statusHash['Passed']/(statusHash['Passed'] +
      statusHash['Failed'] + statusHash['Not Reviewed'] + statusHash['Profile Error']) * 100)
    return this.state.status;
  },
  setStatus(val) {
    this.state.status = val;
  },
  getImpact() {
    var impactHash = {
      'low':      0,
      'medium':   0,
      'high':     0,
      'critical': 0
    };
    var controls = this.getControls();
    for (var ind in controls) {
      impactHash[controls[ind].severity] += 1;
    }
    for (var i = 0; i < this.state.impact.length; i++) {
      this.state.impact[i][1] = impactHash[this.state.impact[i][0]];
    }
    return this.state.impact;
  },
  getCompliance() {
    return [['Data', this.state.compliance]];
  },
  setCompliance(val) {
    this.state.compliance = val;
  },
  getTitle() {
    return this.state.title;
  },
  setTitle(val) {
    this.state.title = val;
    this.state.showing = 'Results';
  },
  getStatusFilter() {
    return this.state.status_filter;
  },
  setStatusFilter(val) {
    this.state.status_filter = val;
  },
  getImpactFilter() {
    return this.state.impact_filter;
  },
  setImpactFilter(val) {
    this.state.impact_filter = val;
  },
  getSelectedFamily() {
    return this.state.selected_family;
  },
  setSelectedFamily(val) {
    this.state.selected_family = val;
  },
  getSelectedSubFamily() {
    return this.state.selected_subfamily;
  },
  setSelectedSubFamily(val) {
    this.state.selected_subfamily = val;
  },
  getSelectedControl() {
    return this.state.selected_control;
  },
  setSelectedControl(val) {
    this.state.selected_control = val;
  },
  getSearchTerm() {
    if (this.state.search_term.length > 1) {
      return this.state.search_term;
    } else {
      return ''
    }
  },
  setSearchTerm(val) {
    this.state.search_term = val;
  },
  setNistHash() {
    var hsh = {'name': 'NIST SP 800-53', 'children': []}
    for (var i = 0; i < this.state.families.length; i++) {
      var fam = this.state.families[i];
      var fam_hsh = {'name': fam[0], 'desc': fam[1], 'count': 0, 'children': []};
      for (var j = 0; j < fam[2]; j++) {
        var name = fam[0] + '-' + (j+1);
        var nist_hsh = {'name': name, 'count': 0, 'value': 1};
        fam_hsh['children'].push(nist_hsh);
        this.state.controls_hsh[name] = [];
      }
      hsh['children'].push(fam_hsh)
    }
    this.state.nist_hsh = hsh;
  },
  getNistHash() {
    if (this.state.nist_hsh.length == undefined) {
      this.setNistHash();
    }
    var hsh = this.state.nist_hsh;
    var ctls_hsh = this.state.controls_hsh;
    var controls = this.getNistControls()
    for (var index in controls) {
      if (controls[index].nist) {
        var nists = controls[index].nist;
        for (var i = 0; i < nists.length; i++) {
          var tag = nists[i].split(' ')[0];
          if (tag in ctls_hsh) {
            ctls_hsh[tag].push(controls[index]);
          }
        }
      } else {
        ctls_hsh['UM-1'].push(controls[index]);
      }
    }
    for (var j = 0; j < hsh['children'].length; j++) {
      var fam_count = 0;
      var fam_status = [];
      for (var k = 0; k < hsh['children'][j]['children'].length; k++) {
        var obj = hsh['children'][j]['children'][k];
        if (obj['name'] in ctls_hsh) {
          //console.log("For " + obj['name']);
          var children = [];
          var ctl_status = [];
          for (var l = 0; l < ctls_hsh[obj['name']].length; l++) {
            ctl_status.push(ctls_hsh[obj['name']][l].status);
            var fam_hsh = {'name': ctls_hsh[obj['name']][l].gid, status: ctls_hsh[obj['name']][l].status, 'value': 1};
            //console.log("Push " + ctls_hsh[obj['name']][l].gid);
            children.push(fam_hsh);
          }
          hsh['children'][j]['children'][k]['children'] = children;
          hsh['children'][j]['children'][k]['count'] = ctls_hsh[obj['name']].length;
          fam_count += ctls_hsh[obj['name']].length;
          hsh['children'][j]['children'][k]['status'] = this.getStatusValue(ctl_status);
          fam_status.push(hsh['children'][j]['children'][k]['status']);
        }
      }
      hsh['children'][j]['count'] = fam_count;
      hsh['children'][j]['status'] = this.getStatusValue(fam_status);
    }
    return hsh;
  },
  getFilteredFamilies() {
    var nist_hsh = this.getNistHash();
    var filtered_fams = [];
    for (var i = 0; i < nist_hsh['children'].length; i++) {
      var family_hsh = nist_hsh['children'][i];
      var sub_families = [];
      for (var j = 0; j < family_hsh['children'].length; j++) {
        var sub_family_hsh = family_hsh['children'][j];
        if (sub_family_hsh['children'].length > 0) {
          var children = [];
          for (var k = 0; k < sub_family_hsh['children'].length; k++) {
            var control = this.getControl(sub_family_hsh['children'][k]['name'])
            control.vuln_discuss = control.vuln_discuss.replace(/<br>/g, '\n');
            control.check_content = control.check_content.replace(/<br>/g, '\n');
            control.fix_text = control.fix_text.replace(/<br>/g, '\n');
            children.push(control);
          }
          sub_families.push({'name': sub_family_hsh['name'], 'items': children});
        }
      }
      if (sub_families.length > 0) {
        filtered_fams.push({'name': family_hsh['name'], 'desc': family_hsh['desc'], 'items': sub_families});
      }
    }
    return filtered_fams;
  },
  getStatusValue(status_Ary) {
    var fam_status = 'Empty';
    if (status_Ary.includes('Failed')) {
      fam_status = 'Failed'
    } else if (status_Ary.includes('Profile Error')) {
      fam_status = 'Profile Error'
    } else if (status_Ary.includes('Not Reviewed')) {
      fam_status = 'Not Reviewed'
    } else if (status_Ary.includes('Passed')) {
      fam_status = 'Passed'
    } else if (status_Ary.includes('Not Applicable')) {
      fam_status = 'Not Applicable'
    }
    return fam_status;
  },
};
