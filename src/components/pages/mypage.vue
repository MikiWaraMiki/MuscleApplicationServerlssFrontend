<template>
        <v-container> 
            <v-toolbar flat color="white">
                <v-toolbar-title>ToDo一覧</v-toolbar-title>
                <v-divider
                    class="mx-2"
                    inset
                    vertical
                >
                </v-divider>
                <v-spacer></v-spacer>
                <v-btn color="primary" class="mb-2" @click="openDialog">ToDo登録</v-btn>
            </v-toolbar>
            <openDialog :dialog="dialog" @close="closeForm">
                <taskRegisterForm slot="content" :editFlg="editIndex" :todo="todo" @close="closeForm" @append="appendTodo($event, todo)" @update="updateTodo($event,todo)"></taskRegisterForm>
            </openDialog>
            <openDialog :dialog="completeDialog" @close="closeForm">
                <taskCompleteForm slot="content" :todo="todo" @complete="afterComplete($event, todo)" @close="closeForm"></taskCompleteForm>
            </openDialog>
            <myDataTable ref="table" :headers="headers" :todos="todos" @edit="editForm($event, todo)" @delete="deleteConfirm($event, todo)" @complete="completeTodo($event,todo)">
            </myDataTable>
            <v-layout row wrap>
                <v-flex xs-12 md-6>
                    <v-spacer></v-spacer>
                    <myPieGraph class='chart' ref="graph" :dataset="pieData"></myPieGraph>
                </v-flex>
                <v-flex xs-12 md-6>
                    <myCompleteGraph class='chart' ref="completegraph" :dataset="lineData" :label="'Todo完了数'" :graphtitle="'Todo完了数推移'"></myCompleteGraph>
                    <v-spacer></v-spacer>
                </v-flex>
            </v-layout>
            <v-layout row mt-4>
                <v-flex xs12 d-flex>
                    <mySelectBox :todos="completeTodos" :label="'トレーニングを選択'" @get="getTrendData($event, training_name)"></mySelectBox>
                </v-flex>
            </v-layout>

            <v-layout align center justify-center row>
                <v-flex md-6 xs-12 m-auto>
                    <myCompleteGraph class='chart' :dataset="weightData" :label="'重量'" :graphtitle="'重量推移'" v-show="isShowGraph"></myCompleteGraph>
                </v-flex>
                <v-flex md-6 xs-12 m-auto>
                    <myCompleteGraph class='chart' :dataset="setData" :label="'セット数'" :graphtitle="'セット数推移'" v-show="isShowGraph"></myCompleteGraph>
                </v-flex>
            </v-layout>
        </v-container>
</template>
<script>
import Dialog from '../parts/openDialog'
import TaskRegisterForm from '../parts/taskRegisterForm'
import TaskCompleteForm from '../parts/taskCompleteForm'
import DataTable from '../parts/dataTable'
import PieChart  from '../parts/piechart'
import LineChart from '../parts/linechart'
import SelectBox from '../parts/selectBox'
import SetWeightLineChart from '../parts/linechartSetWight' 
import request from '../../utils/request'
import * as AwsUtil  from '../../utils/AwsUtil'
import store from '../../store/store'
export default {
    data: () => ({
        dialog: false,
        completeDialog: false,
        todo: [],
        editIndex: -1,
        headers: [
           {
                text: "完了予定日",
                sortable: true,
                value: "clear_plan"
            },
            {
                text: "メニュー数",
                sortable: false,
                value: "menu_num"
            },
            {
                text: "操作",
                align: 'center',
                sortable: false,
                value: 'action'
            }
        ],
        subHeader: [
            {
                text: "ToDo名",
                align: "left",
                sortable: false,
                value: "name"
            },
            {
                text: "重さ",
                sortable: false,
                value: "weight"
            },
            {
                text: "セット数",
                sortable: false,
                value: "set"
            },
            {
                text: "登録日",
                sortable: true,
                value: "created_at"
            }
        ],
        todos: [],
        completeTodos: [],
        pieData: {},
        lineData: {},
        training_name: "",
        isLoading: false,
        weightData: {},
        setData: {},
        base_url: process.env.VUE_APP_API_GATEWAY_BASE_URL
    }),
    computed: {
        isShowGraph: function() {
            if(Object.keys(this.weightData).length === 0){
                return false
            }else{
                return true
            }
        }
    },
    created() {
        //url
        const api_name = 'MuscleApi'
        const path     = '/todos'
        // Todo一覧を取得
        AwsUtil.getAPI(api_name, `${path}`).then( response => {
            this.todos = response.data["not_complete"]
            // 完了済みデータの一覧
            this.completeTodos = response.data["complete"]
            //グラフ描画
            const pie_data  = response.data["pie"]
            const line_data = response.data["line"]
            // 円グラフ描画
            this.pieData    = Object.assign({}, pie_data)
            //折れ線グラフ
            this.lineData   = Object.assign({}, line_data)
        }).catch( error => {
            console.log(error)
            this.$store.commit('message/setMessage', {"message":"Todoの取得に失敗しました", "type":"error"}, {root: true})
        })
    },
    components: {
        "openDialog": Dialog,
        "taskRegisterForm": TaskRegisterForm,
        "myDataTable": DataTable,
        "taskCompleteForm": TaskCompleteForm,
        "MyPieGraph": PieChart,
        "myCompleteGraph": LineChart,
        "mySelectBox": SelectBox,
        "myWeightGraph": SetWeightLineChart
    },
    methods: {
        openDialog(){
            this.dialog = true
        },
        closeForm(){
            this.editIndex = -1
            this.todo      = {
                name: "",
                menu:"",
                created_at: new Date().toISOString().substr(0,10),
                complete_plan_date: new Date().toISOString().substr(0,10)
            }
            this.dialog         = false
            this.completeDialog = false
        },
        createLineData(datas){
            const line_data_object = {}
            for(let i = 0, l = datas.length; i < l; i += 1){
                const data = datas[i]
                line_data_object[Object.keys(data)[0]] = Object.values(data)[0]
            }
            return line_data_object
        },
        appendTodo(todo){
            this.todos.push(todo)
        },
        updateTodo(todo){
            //元データを更新
            const index = this.editIndex
            this.editIndex  = -1
            this.todos[index] = todo
            //テーブルのデータを更新
            this.$refs.table.updateItem(index, todo)
        },
        editForm(todoArgs){
            this.todo = Object.assign({}, todoArgs.todo)
            this.editIndex = todoArgs.index
            this.dialog = true
        },
        deleteConfirm(todoArgs){
            this.editIndex = todoArgs.index;
            this.todo      = Object.assign({}, todoArgs.todo)
            confirm("このTodoを削除します。よろしいですか?") && this.deleteTodo()
        },
        deleteTodo(){
            // Todoを削除
            const options  = {
                auth: true,
            }
            console.log(base_url)
            request.delete(`${base_url}/api/v1/todo/${this.todo.todo_id}`, options).then( (response) => {
                //データから削除
                this.todos.splice(this.editIndex, 1)
                this.$store.commit("message/setMessage", {"message": "削除しました"}, {root: true})
                this.close()
            }, (error) => {
                // responce code is 403
                if (error.response.status) {
                    this.$store.commit("message/setMessage", {"message": "不正な操作です。", "type": "error"}, {root: true})
                }
                else{
                    this.$store.commit("message/setMessage", {"message": "削除できませんでした。しばらくしてからやり直してください", "type":"error"}, {root: true})
                }
                this.closeForm()
            })
        },
        completeTodo(todoArgs){
            this.editIndex      = todoArgs.index;
            this.todo           = Object.assign({}, todoArgs.todo)
            this.completeDialog = true
        },
        afterComplete(todo){
            // データの更新
            const updatePieData  = Object.assign({}, this.pieData)
            const updateLineData = Object.assign({}, this.lineData)
            console.log(todo.menu)
            //円グラフのデータを追加
            for(let menu of todo.menu){
                updatePieData[menu.name]       = ( menu.name in this.pieData ) ? (this.pieData[menu.name] + 1) : 1
            }
            updateLineData[todo.clear_date] = ( todo.clear_date in this.lineData) ? (this.lineData[todo.clear_date] + 1) : 1
            this.pieData  = Object.assign({}, updatePieData)
            //折れ線グラフのデータは日付順に並び替える
            this.lineData = Object.assign({}, updateLineData)
            // データテーブルから削除する
            this.todos.splice(this.editIndex, 1)
            // データを初期化する
            this.todo      = {
                name: "",
                menu:"",
                created_at: new Date().toISOString().substr(0,10),
                complete_plan_date: new Date().toISOString().substr(0,10)
            }
        },
        getTrendData(training_name){
            if (this.isLoading) return;
            this.isLoading = true
            const path     = '/analize/trend'
            const payload  = {
                name: training_name
            }
            AwsUtil.postAPI('', path, payload).then( (response) => {
                this.weightData = Object.assign({}, response.item.weight)
                this.setData    = Object.assign({}, response.item.set)
                this.isLoading = false;
            }, (error) => {
                console.log(error)
            })
        }

    }
}
</script>
<style scoped>
.chart {
    min-width: 300px;
    max-width: 600px;
}
</style>