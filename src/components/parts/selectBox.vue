<template>
        <v-select
            v-model="value"
            :items="items"
            :label="label"
            @input="updateValue"
        >
        </v-select>
</template>
<script>
import request from '../../utils/request'
export default {
    props: ["todos", "label"],
    data: () => ({
        items: ["1", "3", "2"],
        value: ["1", "3", "2"],
        isLoading: false,

    }),
    mounted() {
        console.log(this.todos)
    },
    methods: {
        updateValue(e){
            console.log(e)
            this.$emit('get', e)
        }
    },
    watch: {
        todos: {
            immediate: true,
            handler(val, oldval) {
                console.log(val)
                this.items = val
                this.value = val
            }
        }
    }
}
</script>

